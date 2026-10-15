import type { Prisma } from "@prisma/client";
import { toSectionType, type SectionType } from "./cv.rules";

/*
 * `CvVersion.lastSnapshot`: the sections and contact header as they were
 * before the last bulk apply, so the user can undo it. Restoring swaps the
 * snapshot with the current content (so a second restore redoes the apply).
 */

export const CONTACT_FIELDS = [
  "name",
  "email",
  "photoUrl",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
export type CvContact = Record<ContactField, string | null>;

export interface SnapshotSection {
  title: string;
  content: string;
  sectionType: SectionType;
}

export interface CvContentSnapshot {
  takenAt: string;
  contact: CvContact;
  sections: SnapshotSection[];
}

/** Upper bound when reading a stored snapshot (older versions had no section cap). */
const MAX_SNAPSHOT_SECTIONS = 100;

export function buildSnapshot(
  contact: CvContact,
  sections: { title: string; content: string; sectionType: string }[],
  now: Date = new Date(),
): CvContentSnapshot {
  return {
    takenAt: now.toISOString(),
    contact: pickContact(contact),
    sections: sections.map((s) => ({
      title: s.title,
      content: s.content,
      sectionType: toSectionType(s.sectionType),
    })),
  };
}

export function pickContact(source: Partial<Record<ContactField, unknown>>): CvContact {
  const contact = {} as CvContact;
  for (const field of CONTACT_FIELDS) {
    const value = source[field];
    contact[field] = typeof value === "string" ? value : null;
  }
  return contact;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a stored snapshot defensively; null when missing or malformed. */
export function parseSnapshot(
  value: Prisma.JsonValue | null | undefined,
): CvContentSnapshot | null {
  if (!isRecord(value) || !isRecord(value.contact) || !Array.isArray(value.sections)) {
    return null;
  }
  const sections: SnapshotSection[] = [];
  for (const raw of value.sections.slice(0, MAX_SNAPSHOT_SECTIONS)) {
    if (!isRecord(raw) || typeof raw.title !== "string" || typeof raw.content !== "string") {
      return null;
    }
    sections.push({
      title: raw.title,
      content: raw.content,
      sectionType: toSectionType(raw.sectionType),
    });
  }
  return {
    takenAt: typeof value.takenAt === "string" ? value.takenAt : "",
    contact: pickContact(value.contact),
    sections,
  };
}

/** Prisma JSON input for a snapshot. */
export function snapshotToJson(snapshot: CvContentSnapshot): Prisma.InputJsonObject {
  return {
    takenAt: snapshot.takenAt,
    contact: { ...snapshot.contact },
    sections: snapshot.sections.map((s) => ({ ...s })),
  };
}
