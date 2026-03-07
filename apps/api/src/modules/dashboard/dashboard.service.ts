import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [cvCount, coverLetterCount, jobCount] = await Promise.all([
      this.prisma.cvVersion.count({ where: { userId } }),
      this.prisma.coverLetter.count({ where: { userId } }),
      this.prisma.job.count({ where: { userId } }),
    ]);

    // Recent activity: last 5 updated items across CV versions and cover letters
    const [recentCvs, recentLetters] = await Promise.all([
      this.prisma.cvVersion.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, updatedAt: true },
      }),
      this.prisma.coverLetter.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    const recentActivity = [
      ...recentCvs.map((c) => ({
        type: "cv" as const,
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
      ...recentLetters.map((l) => ({
        type: "cover-letter" as const,
        id: l.id,
        title: l.title,
        updatedAt: l.updatedAt,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    return {
      counts: {
        cvVersions: cvCount,
        coverLetters: coverLetterCount,
        jobs: jobCount,
      },
      recentActivity,
    };
  }
}
