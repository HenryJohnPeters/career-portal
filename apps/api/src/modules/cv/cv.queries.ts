import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { normalizeThemeConfig, type ThemeConfig } from "../pdf/templates/theme";
import { MAX_CV_VERSIONS_PER_USER } from "./cv.rules";

/** Section order, with creation time breaking ties left by older data. */
export const SECTION_ORDER: Prisma.CvSectionOrderByWithRelationInput[] = [
  { order: "asc" },
  { createdAt: "asc" },
];

/** Every CvVersion column except `lastSnapshot` (large; exposed as `hasSnapshot`). */
const CV_VERSION_FIELDS = {
  id: true,
  userId: true,
  title: true,
  isActive: true,
  templateId: true,
  themeConfig: true,
  headerLayout: true,
  name: true,
  email: true,
  photoUrl: true,
  phone: true,
  location: true,
  website: true,
  linkedin: true,
  github: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CvVersionSelect;

export const CV_VERSION_SELECT = {
  ...CV_VERSION_FIELDS,
  sections: { orderBy: SECTION_ORDER },
} as const satisfies Prisma.CvVersionSelect;

/** GET /cv/versions?summary=1 (`CvVersionSummary` in libs/shared/types cv.ts). */
export const CV_VERSION_SUMMARY_SELECT = {
  id: true,
  title: true,
  isActive: true,
  templateId: true,
  updatedAt: true,
} as const satisfies Prisma.CvVersionSelect;

export type CvVersionSummary = Prisma.CvVersionGetPayload<{
  select: typeof CV_VERSION_SUMMARY_SELECT;
}>;

export type CvVersionRow = Prisma.CvVersionGetPayload<{
  select: typeof CV_VERSION_SELECT;
}>;

/** The `CvVersion` API shape (libs/shared/types cv.ts). */
export type CvVersionPayload = Omit<CvVersionRow, "themeConfig"> & {
  themeConfig: ThemeConfig;
  hasSnapshot: boolean;
};

/** Where-fragment matching versions that hold an undo snapshot. */
export const HAS_SNAPSHOT: Prisma.CvVersionWhereInput = {
  lastSnapshot: { not: Prisma.DbNull },
};

export function toCvVersionPayload(
  row: CvVersionRow,
  hasSnapshot: boolean,
): CvVersionPayload {
  return {
    ...row,
    themeConfig: normalizeThemeConfig(row.themeConfig),
    hasSnapshot,
  };
}

export const cvVersionNotFound = () => new NotFoundException("CV version not found");
export const cvSectionNotFound = () => new NotFoundException("Section not found");
export const cvVersionCapReached = () =>
  new ForbiddenException(
    `You can keep up to ${MAX_CV_VERSIONS_PER_USER} CV versions. Delete some to create new ones.`,
  );
