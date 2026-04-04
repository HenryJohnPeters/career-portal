import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

const JOB_INCLUDE = {
  cvVersion: { select: { id: true, title: true } },
  linkedCoverLetter: { select: { id: true, title: true } },
} as const;

const LEGACY_STATUS_MAP: Record<string, string> = {
  saved: "wishlist",
  interview: "phone_screen",
  offer: "accepted",
  ghosted: "rejected",
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const jobs = await this.prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: JOB_INCLUDE,
    });

    return jobs.map((job) => this.normalizeJob(job));
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
    },
  ) {
    const { cvVersionId, coverLetterId } =
      await this.resolveOwnedRelations(userId, data);

    const created = await this.prisma.job.create({
      data: {
        userId,
        company: data.company,
        role: data.role,
        status: this.normalizeStatus(data.status) ?? "applied",
        url: data.url ?? null,
        notes: data.notes ?? null,
        cvVersionId: cvVersionId ?? null,
        coverLetterId: coverLetterId ?? null,
      },
      include: JOB_INCLUDE,
    });

    return this.normalizeJob(created);
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
    },
  ) {
    await this.assertOwner(userId, jobId);
    const { cvVersionId, coverLetterId } =
      await this.resolveOwnedRelations(userId, data);

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        company: data.company,
        role: data.role,
        status:
          data.status !== undefined
            ? this.normalizeStatus(data.status)
            : undefined,
        url: data.url !== undefined ? data.url || null : undefined,
        notes: data.notes !== undefined ? data.notes || null : undefined,
        cvVersionId,
        coverLetterId,
        followUpDate:
          data.followUpDate !== undefined
            ? data.followUpDate
              ? new Date(data.followUpDate)
              : null
            : undefined,
      },
      include: JOB_INCLUDE,
    });

    return this.normalizeJob(updated);
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

  private normalizeStatus(status: string | undefined): string | undefined {
    if (!status) return undefined;
    return LEGACY_STATUS_MAP[status] ?? status;
  }

  private normalizeJob<T extends { status: string }>(job: T): T {
    return {
      ...job,
      status: this.normalizeStatus(job.status) ?? "applied",
    };
  }

  private async resolveOwnedRelations(
    userId: string,
    data: { cvVersionId?: string; coverLetterId?: string },
  ): Promise<{
    cvVersionId: string | null | undefined;
    coverLetterId: string | null | undefined;
  }> {
    const resolveId = (id: string | undefined) => {
      if (id === undefined) return undefined;
      const trimmed = id.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const cvVersionId = resolveId(data.cvVersionId);
    const coverLetterId = resolveId(data.coverLetterId);

    if (cvVersionId) {
      const cv = await this.prisma.cvVersion.findFirst({
        where: { id: cvVersionId, userId },
        select: { id: true },
      });
      if (!cv) throw new NotFoundException("CV version not found");
    }

    if (coverLetterId) {
      const coverLetter = await this.prisma.coverLetter.findFirst({
        where: { id: coverLetterId, userId },
        select: { id: true },
      });
      if (!coverLetter) throw new NotFoundException("Cover letter not found");
    }

    return { cvVersionId, coverLetterId };
  }
}
