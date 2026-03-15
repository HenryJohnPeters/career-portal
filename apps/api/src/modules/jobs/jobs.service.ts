import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

const JOB_INCLUDE = {
  cvVersion: { select: { id: true, title: true } },
  linkedCoverLetter: { select: { id: true, title: true } },
} as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: JOB_INCLUDE,
    });
  }

  async create(
    userId: string,
    data: {
      company: string;
      role: string;
      status?: string;
      url?: string;
      notes?: string;
      cvVersionId?: string;
      coverLetterId?: string;
    }
  ) {
    return this.prisma.job.create({
      data: {
        userId,
        company: data.company,
        role: data.role,
        status: data.status ?? "applied",
        url: data.url ?? null,
        notes: data.notes ?? null,
        cvVersionId: data.cvVersionId ?? null,
        coverLetterId: data.coverLetterId ?? null,
      },
      include: JOB_INCLUDE,
    });
  }

  async update(
    userId: string,
    jobId: string,
    data: {
      company?: string;
      role?: string;
      status?: string;
      url?: string;
      notes?: string;
      cvVersionId?: string;
      coverLetterId?: string;
      followUpDate?: string;
    }
  ) {
    await this.assertOwner(userId, jobId);

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        company: data.company,
        role: data.role,
        status: data.status,
        url: data.url !== undefined ? data.url || null : undefined,
        notes: data.notes !== undefined ? data.notes || null : undefined,
        cvVersionId:
          data.cvVersionId !== undefined ? data.cvVersionId || null : undefined,
        coverLetterId:
          data.coverLetterId !== undefined
            ? data.coverLetterId || null
            : undefined,
        followUpDate:
          data.followUpDate !== undefined
            ? data.followUpDate
              ? new Date(data.followUpDate)
              : null
            : undefined,
      },
      include: JOB_INCLUDE,
    });
  }

  async remove(userId: string, jobId: string) {
    await this.assertOwner(userId, jobId);
    await this.prisma.job.delete({ where: { id: jobId } });
  }

  private async assertOwner(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) throw new NotFoundException("Job not found");
    return job;
  }
}
