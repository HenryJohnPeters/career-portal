import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsObject,
  IsArray,
  MaxLength,
  IsUrl,
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  ValidateIf,
  ValidateNested,
  IsEmail,
  IsNotEmpty,
  IsUUID,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CV_CONTACT_LIMITS,
  CV_LIMITS,
  SECTION_TYPES,
  normalizeContactUrl,
  toSectionType,
  type ContactUrlKind,
  type SectionType,
} from "./cv.rules";
import { HEADER_LAYOUTS } from "../pdf/templates/theme";
import { TEMPLATE_IDS } from "../pdf/templates/registry";

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

/** Adds https:// (or the profile URL for a bare handle); "" becomes null. */
const contactUrl = (kind: ContactUrlKind) =>
  Transform(({ value }) => {
    if (typeof value !== "string") return value;
    return normalizeContactUrl(kind, value) || null;
  });

/** Lowercase known section type; unknown strings become "custom". */
const sectionType = () =>
  Transform(({ value }) => (typeof value === "string" ? toSectionType(value) : value));

const WEB_URL = { protocols: ["http", "https"], require_protocol: true };

/* ── Versions ──────────────────────────────────────────────────────── */

export class CreateCvVersionDto {
  @ApiProperty({ example: "My CV v1", maxLength: CV_LIMITS.versionTitle })
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CV_LIMITS.versionTitle)
  title!: string;
}

/**
 * Contact header fields. Each may be omitted (unchanged), or null / "" to
 * clear it. URLs are normalised before validation.
 */
export class CvContactDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.name)
  name?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @emptyToNull()
  @IsEmail()
  @MaxLength(CV_CONTACT_LIMITS.email)
  email?: string | null;

  @ApiPropertyOptional({ nullable: true, description: "https URL of the photo" })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.photoUrl)
  @IsUrl(
    { protocols: ["https"], require_protocol: true },
    { message: "photoUrl must be a valid HTTPS URL" },
  )
  photoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.phone)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.location)
  location?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "example.com" })
  @IsOptional()
  @contactUrl("website")
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.url)
  @IsUrl(WEB_URL, { message: "website must be a valid URL" })
  website?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "linkedin.com/in/username" })
  @IsOptional()
  @contactUrl("linkedin")
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.url)
  @IsUrl(WEB_URL, { message: "linkedin must be a valid URL" })
  linkedin?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "github.com/username" })
  @IsOptional()
  @contactUrl("github")
  @IsString()
  @MaxLength(CV_CONTACT_LIMITS.url)
  @IsUrl(WEB_URL, { message: "github must be a valid URL" })
  github?: string | null;
}

export class UpdateCvVersionDto extends CvContactDto {
  @ApiPropertyOptional({ maxLength: CV_LIMITS.versionTitle })
  @OptionalNonNull()
  @trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CV_LIMITS.versionTitle)
  title?: string;

  @ApiPropertyOptional()
  @OptionalNonNull()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: TEMPLATE_IDS })
  @OptionalNonNull()
  @IsIn(TEMPLATE_IDS, { message: "Unknown template" })
  templateId?: string;

  @ApiPropertyOptional({
    description:
      "Merged over the stored theme. Invalid values fall back to defaults; unknown keys are dropped.",
  })
  @OptionalNonNull()
  @IsObject()
  themeConfig?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: HEADER_LAYOUTS })
  @OptionalNonNull()
  @IsIn(HEADER_LAYOUTS)
  headerLayout?: string;
}

/* ── Sections ──────────────────────────────────────────────────────── */

export class CreateCvSectionDto {
  @ApiProperty({ example: "Custom Section", maxLength: CV_LIMITS.sectionTitle })
  @IsString()
  @MaxLength(CV_LIMITS.sectionTitle)
  title!: string;

  @ApiPropertyOptional({ example: "", maxLength: CV_LIMITS.sectionContent })
  @OptionalNonNull()
  @IsString()
  @MaxLength(CV_LIMITS.sectionContent)
  content?: string;

  @ApiPropertyOptional({ enum: SECTION_TYPES, example: "custom" })
  @OptionalNonNull()
  @IsString()
  @sectionType()
  @IsIn(SECTION_TYPES)
  sectionType?: SectionType;
}

export class UpdateCvSectionDto {
  @ApiPropertyOptional({ maxLength: CV_LIMITS.sectionTitle })
  @OptionalNonNull()
  @IsString()
  @MaxLength(CV_LIMITS.sectionTitle)
  title?: string;

  @ApiPropertyOptional({ maxLength: CV_LIMITS.sectionContent })
  @OptionalNonNull()
  @IsString()
  @MaxLength(CV_LIMITS.sectionContent)
  content?: string;

  @ApiPropertyOptional({ enum: SECTION_TYPES })
  @OptionalNonNull()
  @IsString()
  @sectionType()
  @IsIn(SECTION_TYPES)
  sectionType?: SectionType;
}

export class MoveSectionDto {
  @ApiProperty({ enum: ["up", "down"] })
  @IsIn(["up", "down"])
  direction!: "up" | "down";
}

export class ReorderSectionsDto {
  @ApiProperty({
    type: [String],
    description: "Every section id of the version, each exactly once, in the new order.",
  })
  @IsArray()
  @ArrayMinSize(1)
  // Above the section cap so versions created before the cap can still be reordered.
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  sectionIds!: string[];
}

/* ── Bulk content (PUT /cv/versions/:id/content) ───────────────────── */

export class ApplyCvContentSectionDto {
  @ApiProperty({ maxLength: CV_LIMITS.sectionTitle })
  @IsString()
  @MaxLength(CV_LIMITS.sectionTitle)
  title!: string;

  @ApiProperty({ maxLength: CV_LIMITS.sectionContent })
  @IsString()
  @MaxLength(CV_LIMITS.sectionContent)
  content!: string;

  @ApiProperty({ enum: SECTION_TYPES })
  @IsString()
  @sectionType()
  @IsIn(SECTION_TYPES)
  sectionType!: SectionType;
}

export class ApplyCvContentDto {
  @ApiPropertyOptional({ type: CvContactDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CvContactDto)
  contact?: CvContactDto;

  @ApiProperty({ type: [ApplyCvContentSectionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(CV_LIMITS.maxSectionsPerVersion)
  @ValidateNested({ each: true })
  @Type(() => ApplyCvContentSectionDto)
  sections!: ApplyCvContentSectionDto[];
}

/* ── AI ────────────────────────────────────────────────────────────── */

export class AiGenerateCvSectionDto {
  @ApiProperty({ enum: ["generate", "improve", "tailor"] })
  @IsIn(["generate", "improve", "tailor"])
  action!: "generate" | "improve" | "tailor";

  @ApiPropertyOptional({
    description: "The editor's current text; preferred over the saved content.",
    maxLength: CV_LIMITS.sectionContent,
  })
  @IsOptional()
  @IsString()
  @MaxLength(CV_LIMITS.sectionContent)
  currentContent?: string;

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({
    example: "We are looking for a Senior Frontend Engineer...",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  jobDescription?: string;
}

export class AiGenerateFullCvDto {
  @ApiProperty({
    example: "I worked at Google for 3 years as a software engineer...",
  })
  @IsString()
  @MaxLength(20000)
  rawText!: string;

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({
    example:
      "We are looking for a Senior Frontend Engineer with 5+ years of experience...",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  jobDescription?: string;
}
