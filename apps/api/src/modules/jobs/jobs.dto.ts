import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  JOB_FIELD_LIMITS,
  JOB_LIMITS,
  JOB_STATUSES,
  type JobStatus,
} from "./jobs.constants";

/* ── Field helpers ─────────────────────────────────────────────────── */

/** Optional, but `null` is rejected (for non-nullable columns). */
const OptionalNonNull = () => ValidateIf((_o, value) => value !== undefined);

const trim = () =>
  Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

/** Trimmed; "" becomes null so it clears the stored value. */
const emptyToNull = () =>
  Transform(({ value }) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

/** Like emptyToNull, and adds https:// when the scheme is missing ("acme.com/jobs/1"). */
const webUrl = () =>
  Transform(({ value }) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (trimmed === "") return null;
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  });

/** Trimmed, blank entries dropped, de-duplicated case-insensitively; null → []. */
const skillList = () =>
  Transform(({ value }) => {
    if (value === null) return [];
    if (!Array.isArray(value)) return value;
    const seen = new Set<string>();
    const out: unknown[] = [];
    for (const item of value) {
      if (typeof item !== "string") {
        out.push(item); // rejected by @IsString({ each: true })
        continue;
      }
      const skill = item.trim().replace(/\s+/g, " ");
      const key = skill.toLowerCase();
      if (!skill || seen.has(key)) continue;
      seen.add(key);
      out.push(skill);
    }
    return out;
  });

const URL_OPTIONS = {
  protocols: ["http", "https"],
  require_protocol: true,
  disallow_auth: true,
};
const STRICT_DATE = { strict: true };

/* ── Create / update ──────────────────────────────────────────────── */

/**
 * POST /jobs. Nullable fields accept null or "" (stored as null). Linked
 * CV / cover-letter ids must belong to the user (404 otherwise).
 */
export class CreateJobDto {
  @ApiProperty({ example: "Acme Corp", maxLength: JOB_FIELD_LIMITS.company })
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_FIELD_LIMITS.company)
  company!: string;

  @ApiProperty({ example: "Frontend Developer", maxLength: JOB_FIELD_LIMITS.role })
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_FIELD_LIMITS.role)
  role!: string;

  @ApiPropertyOptional({ enum: JOB_STATUSES, default: "applied" })
  @OptionalNonNull()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;

  @ApiPropertyOptional({ nullable: true, example: "https://acme.com/jobs/1" })
  @webUrl()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_FIELD_LIMITS.url)
  @IsUrl(URL_OPTIONS)
  url?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_FIELD_LIMITS.notes })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_FIELD_LIMITS.notes)
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "uuid" })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  cvVersionId?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "uuid" })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  coverLetterId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "2026-11-02" })
  @emptyToNull()
  @IsOptional()
  @IsDateString(STRICT_DATE)
  followUpDate?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.jobDescription })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.jobDescription)
  jobDescription?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.location })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.location)
  location?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.salary })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.salary)
  salary?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: "Defaults to now when the job is created past the wishlist stage.",
  })
  @emptyToNull()
  @IsOptional()
  @IsDateString(STRICT_DATE)
  appliedAt?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: JOB_LIMITS.keySkills })
  @skillList()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(JOB_LIMITS.keySkills)
  @IsString({ each: true })
  @MaxLength(JOB_LIMITS.keySkillLength, { each: true })
  keySkills?: string[];
}

/**
 * PATCH /jobs/:id. Omitted fields are unchanged; null (or "") clears a
 * nullable field. company, role and status cannot be null.
 */
export class UpdateJobDto {
  @ApiPropertyOptional({ example: "Acme Corp", maxLength: JOB_FIELD_LIMITS.company })
  @OptionalNonNull()
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_FIELD_LIMITS.company)
  company?: string;

  @ApiPropertyOptional({ example: "Frontend Developer", maxLength: JOB_FIELD_LIMITS.role })
  @OptionalNonNull()
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_FIELD_LIMITS.role)
  role?: string;

  @ApiPropertyOptional({ enum: JOB_STATUSES })
  @OptionalNonNull()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;

  @ApiPropertyOptional({ nullable: true })
  @webUrl()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_FIELD_LIMITS.url)
  @IsUrl(URL_OPTIONS)
  url?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_FIELD_LIMITS.notes })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_FIELD_LIMITS.notes)
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "uuid" })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  cvVersionId?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "uuid" })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  coverLetterId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "2026-11-02" })
  @emptyToNull()
  @IsOptional()
  @IsDateString(STRICT_DATE)
  followUpDate?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.jobDescription })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.jobDescription)
  jobDescription?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.location })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.location)
  location?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: JOB_LIMITS.salary })
  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(JOB_LIMITS.salary)
  salary?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @emptyToNull()
  @IsOptional()
  @IsDateString(STRICT_DATE)
  appliedAt?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: JOB_LIMITS.keySkills })
  @skillList()
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(JOB_LIMITS.keySkills)
  @IsString({ each: true })
  @MaxLength(JOB_LIMITS.keySkillLength, { each: true })
  keySkills?: string[];
}

/* ── Match / analyse / tailor ─────────────────────────────────────── */

/** POST /jobs/:id/match */
export class MatchJobDto {
  @ApiPropertyOptional({
    format: "uuid",
    description: "Defaults to the job's linked CV, else the most recently updated CV.",
  })
  @IsOptional()
  @IsUUID("4")
  cvVersionId?: string;
}

/** POST /jobs/match-text */
export class MatchTextDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID("4")
  cvVersionId!: string;

  @ApiProperty({ maxLength: JOB_LIMITS.jobDescription })
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_LIMITS.jobDescription)
  jobDescription!: string;
}

/** POST /jobs/analyze */
export class AnalyzeJobDto {
  @ApiProperty({
    minLength: JOB_LIMITS.jobDescriptionMinForAnalysis,
    maxLength: JOB_LIMITS.jobDescription,
  })
  @trim()
  @IsString()
  @MinLength(JOB_LIMITS.jobDescriptionMinForAnalysis, {
    message: `Paste the full job description (at least ${JOB_LIMITS.jobDescriptionMinForAnalysis} characters).`,
  })
  @MaxLength(JOB_LIMITS.jobDescription)
  jobDescription!: string;
}

export const TAILOR_TONES = ["professional", "enthusiastic", "concise"] as const;
export type TailorTone = (typeof TAILOR_TONES)[number];

/** POST /jobs/:id/tailor (Premium) */
export class TailorApplicationDto {
  @ApiProperty({ format: "uuid", description: "The CV version to copy and tailor." })
  @IsUUID("4")
  cvVersionId!: string;

  @ApiProperty()
  @IsBoolean()
  includeCoverLetter!: boolean;

  @ApiPropertyOptional({ enum: TAILOR_TONES, default: "professional" })
  @IsOptional()
  @IsIn(TAILOR_TONES)
  tone?: TailorTone;
}
