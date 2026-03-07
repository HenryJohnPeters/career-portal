import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsObject,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCvVersionDto {
  @ApiProperty({ example: "My CV v1" })
  @IsString()
  title!: string;
}

export class UpdateCvVersionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  themeConfig?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  headerLayout?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  github?: string;
}

export class CreateCvSectionDto {
  @ApiProperty({ example: "Custom Section" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: "" })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: "custom" })
  @IsString()
  @IsOptional()
  sectionType?: string;
}

export class UpdateCvSectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sectionType?: string;
}

export class MoveSectionDto {
  @ApiProperty({ enum: ["up", "down"] })
  @IsIn(["up", "down"])
  direction!: "up" | "down";
}

export class ReorderSectionsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  sectionIds!: string[];
}

export class AiGenerateCvSectionDto {
  @ApiProperty({ enum: ["generate", "improve", "tailor"] })
  @IsIn(["generate", "improve", "tailor"])
  action!: "generate" | "improve" | "tailor";

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({
    example: "We are looking for a Senior Frontend Engineer...",
  })
  @IsString()
  @IsOptional()
  jobDescription?: string;
}

export class AiGenerateFullCvDto {
  @ApiProperty({
    example: "I worked at Google for 3 years as a software engineer...",
  })
  @IsString()
  rawText!: string;

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsString()
  @IsOptional()
  jobTitle?: string;
}
