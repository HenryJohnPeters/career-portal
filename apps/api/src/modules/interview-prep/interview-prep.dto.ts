import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateBy,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_SELECTED_TAGS, isKnownTag, normalizeTag } from "../../common/tech-tags";
import {
  INTERVIEWER_IDS,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
} from "./interviewer-traits";
import {
  COMPANY_STYLES,
  DIFFICULTIES,
  DURATIONS,
  INTERVIEW_TYPES,
  LEVELS,
  PERSONAS,
  ROLE_FOCUSES,
  TRACKS,
} from "./interview-options";

/** Every element must be a TECH_TAG_CATALOG id, label or alias. */
function IsCatalogTag(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: "isCatalogTag",
      validator: {
        validate: (value: unknown) => typeof value === "string" && isKnownTag(value),
        defaultMessage: (args?: ValidationArguments) => {
          const values: unknown[] = Array.isArray(args?.value) ? args.value : [args?.value];
          const unknown = values
            .filter((v) => typeof v !== "string" || !isKnownTag(v))
            .slice(0, 3)
            .map((v) => `"${String(v).slice(0, 60)}"`);
          return `Unknown tag(s): ${unknown.join(", ")}. Choose tags from the catalog.`;
        },
      },
    },
    options,
  );
}

export class CreateInterviewSessionDto {
  @ApiProperty({ enum: TRACKS })
  @IsString()
  @IsIn(TRACKS)
  track!: string;

  @ApiProperty({ enum: LEVELS })
  @IsString()
  @IsIn(LEVELS)
  level!: string;

  @ApiProperty({
    type: [String],
    maxItems: MAX_SELECTED_TAGS,
    example: ["react", "typescript"],
    description: "Tech-tag catalog ids (labels and aliases are accepted and normalised).",
  })
  @IsArray()
  @ArrayMaxSize(MAX_SELECTED_TAGS)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  @ArrayUnique((tag: unknown) => (typeof tag === "string" ? normalizeTag(tag) : tag), {
    message: "tags must not contain duplicates",
  })
  @IsCatalogTag({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ enum: ROLE_FOCUSES, default: "fullstack" })
  @IsOptional()
  @IsString()
  @IsIn(ROLE_FOCUSES)
  roleFocus?: string;

  @ApiPropertyOptional({ enum: INTERVIEW_TYPES, default: "coding" })
  @IsOptional()
  @IsString()
  @IsIn(INTERVIEW_TYPES)
  interviewType?: string;

  @ApiPropertyOptional({ enum: DURATIONS, default: 60 })
  @IsOptional()
  @IsInt()
  @IsIn(DURATIONS)
  duration?: number;

  @ApiPropertyOptional({ enum: DIFFICULTIES, default: "medium" })
  @IsOptional()
  @IsString()
  @IsIn(DIFFICULTIES)
  difficulty?: string;

  @ApiPropertyOptional({ enum: COMPANY_STYLES, default: "startup" })
  @IsOptional()
  @IsString()
  @IsIn(COMPANY_STYLES)
  companyStyle?: string;

  @ApiPropertyOptional({
    default: 10,
    minimum: MIN_QUESTION_COUNT,
    maximum: MAX_QUESTION_COUNT,
    description: "Ignored when an interviewer is chosen (the interviewer sets the count).",
  })
  @IsOptional()
  @IsInt()
  @Min(MIN_QUESTION_COUNT)
  @Max(MAX_QUESTION_COUNT)
  questionCount?: number;

  @ApiPropertyOptional({ enum: PERSONAS, default: "neutral" })
  @IsOptional()
  @IsString()
  @IsIn(PERSONAS)
  persona?: string;

  @ApiPropertyOptional({ enum: INTERVIEWER_IDS })
  @IsOptional()
  @IsString()
  @IsIn(INTERVIEWER_IDS)
  interviewerId?: string;
}

export class SubmitAnswerDto {
  @ApiProperty({
    example: "2",
    description:
      'Index of the chosen option; for "select all that apply" questions, comma-separated indices such as "0,2".',
  })
  @IsString()
  @MaxLength(64)
  @Matches(/^\s*\d{1,2}\s*(,\s*\d{1,2}\s*)*$/, {
    message: 'answer must be an option index such as "2", or comma-separated indices such as "0,2"',
  })
  answer!: string;
}
