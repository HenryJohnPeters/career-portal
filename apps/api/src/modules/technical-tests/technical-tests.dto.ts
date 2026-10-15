import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
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
  ValidateNested,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MAX_SELECTED_TAGS, isKnownTag, normalizeTag } from "../../common/tech-tags";
import {
  DIFFICULTIES,
  LEVELS,
  ROLE_FOCUSES,
  type Difficulty,
  type Level,
  type RoleFocus,
} from "./engine/scenario-types";
import { MAX_RUBRIC_CRITERIA, MAX_SELF_REVIEW_NOTES } from "./technical-tests.rules";
import { TECH_TEST_RATINGS } from "./technical-tests.types";

/** PLAN §2.10: a submission is 1..100000 characters. */
export const MAX_SUBMISSION_LENGTH = 100_000;

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

export class CreateTechnicalTestDto {
  @ApiProperty({ enum: ROLE_FOCUSES })
  @IsString()
  @IsIn(ROLE_FOCUSES)
  roleFocus!: RoleFocus;

  @ApiProperty({ enum: LEVELS })
  @IsString()
  @IsIn(LEVELS)
  level!: Level;

  @ApiProperty({ enum: DIFFICULTIES })
  @IsString()
  @IsIn(DIFFICULTIES)
  difficulty!: Difficulty;

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
}

export class SubmitTechnicalTestDto {
  @ApiProperty({
    description: "The solution write-up (code, approach, trade-offs).",
    minLength: 1,
    maxLength: MAX_SUBMISSION_LENGTH,
  })
  @IsString()
  @MaxLength(MAX_SUBMISSION_LENGTH)
  @Matches(/\S/, { message: "submission must not be empty" })
  submission!: string;
}

export class SelfReviewRatingDto {
  @ApiProperty({ description: "Index into scenario.evaluationCriteria", minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(MAX_RUBRIC_CRITERIA - 1)
  criterionIndex!: number;

  @ApiProperty({ enum: TECH_TEST_RATINGS })
  @IsInt()
  @IsIn(TECH_TEST_RATINGS)
  score!: number;
}

export class SelfReviewTechnicalTestDto {
  @ApiProperty({ type: [SelfReviewRatingDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RUBRIC_CRITERIA)
  @ValidateNested({ each: true })
  @Type(() => SelfReviewRatingDto)
  ratings!: SelfReviewRatingDto[];

  @ApiPropertyOptional({ maxLength: MAX_SELF_REVIEW_NOTES })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SELF_REVIEW_NOTES)
  notes?: string;
}
