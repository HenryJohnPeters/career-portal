import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { COVER_LETTER_LIMITS } from "./cover-letters.queries";

/* ── Field helpers ─────────────────────────────────────────────────── */

/** Optional, but `null` is rejected (for non-nullable columns). */
const OptionalNonNull = () => ValidateIf((_o, value) => value !== undefined);

const trim = () =>
  Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

/** "" (or whitespace) becomes null, which unlinks. */
const emptyToNull = () =>
  Transform(({ value }) => (typeof value === "string" && value.trim() === "" ? null : value));

const TONES = ["professional", "friendly"] as const;
type Tone = (typeof TONES)[number];

/** Single-line AI context fields (role, company). */
const SHORT_TEXT = 200;
const URL_TEXT = 500;
/** Matches the job-description limit on tracked jobs. */
const JOB_DESCRIPTION_TEXT = 20_000;

/* ── CRUD ─────────────────────────────────────────────────────────── */

export class CreateCoverLetterDto {
  @ApiProperty({ example: "My Cover Letter", maxLength: COVER_LETTER_LIMITS.title })
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(COVER_LETTER_LIMITS.title)
  title!: string;

  @ApiPropertyOptional({ example: "Dear Hiring Manager...", maxLength: COVER_LETTER_LIMITS.body })
  @OptionalNonNull()
  @IsString()
  @MaxLength(COVER_LETTER_LIMITS.body)
  body?: string;

  @ApiPropertyOptional({ nullable: true, format: "uuid", description: "Tracked job to link" })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  jobId?: string | null;
}

export class UpdateCoverLetterDto {
  @ApiPropertyOptional({ maxLength: COVER_LETTER_LIMITS.title })
  @OptionalNonNull()
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(COVER_LETTER_LIMITS.title)
  title?: string;

  @ApiPropertyOptional({ maxLength: COVER_LETTER_LIMITS.body })
  @OptionalNonNull()
  @IsString()
  @MaxLength(COVER_LETTER_LIMITS.body)
  body?: string;

  @ApiPropertyOptional({
    nullable: true,
    format: "uuid",
    description: "Tracked job to link; null or \"\" unlinks",
  })
  @emptyToNull()
  @IsOptional()
  @IsUUID("4")
  jobId?: string | null;
}

/* ── AI ───────────────────────────────────────────────────────────── */

/**
 * Shared by the AI routes. `currentBody` is the editor text and is used
 * instead of the saved body (so unsaved edits are what the AI sees);
 * `useCv: false` means no CV data is sent to the AI.
 */
export class CoverLetterAiContextDto {
  @ApiPropertyOptional({ maxLength: COVER_LETTER_LIMITS.body })
  @IsOptional()
  @IsString()
  @MaxLength(COVER_LETTER_LIMITS.body)
  currentBody?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  useCv?: boolean;
}

export class SuggestCoverLetterDto extends CoverLetterAiContextDto {}

export class RewriteDto extends CoverLetterAiContextDto {
  @ApiPropertyOptional({ enum: TONES, default: "professional" })
  @IsOptional()
  @IsIn(TONES)
  tone?: Tone;
}

export class AiGenerateCoverLetterDto extends CoverLetterAiContextDto {
  @ApiProperty({ enum: ["generate", "improve", "tailor"] })
  @IsIn(["generate", "improve", "tailor"])
  action!: "generate" | "improve" | "tailor";

  @ApiPropertyOptional({ example: "Senior Frontend Engineer", maxLength: SHORT_TEXT })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(SHORT_TEXT)
  jobTitle?: string;

  @ApiPropertyOptional({ example: "Acme Corp", maxLength: SHORT_TEXT })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(SHORT_TEXT)
  companyName?: string;

  @ApiPropertyOptional({
    example: "https://acme.com",
    maxLength: URL_TEXT,
    description: "Reference only: it is quoted to the AI, never fetched.",
  })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(URL_TEXT)
  companyUrl?: string;

  @ApiPropertyOptional({ example: "We are looking for...", maxLength: JOB_DESCRIPTION_TEXT })
  @IsOptional()
  @IsString()
  @MaxLength(JOB_DESCRIPTION_TEXT)
  jobDescription?: string;

  @ApiPropertyOptional({ enum: TONES, default: "professional" })
  @IsOptional()
  @IsIn(TONES)
  tone?: Tone;

  @ApiPropertyOptional({
    format: "uuid",
    description: "CV version to base the letter on (default: the active CV). Ignored when useCv is false.",
  })
  @IsOptional()
  @IsUUID("4")
  cvVersionId?: string;
}
