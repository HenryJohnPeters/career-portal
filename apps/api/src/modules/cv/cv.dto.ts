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
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCvVersionDto {
  @ApiProperty({ example: "My CV v1" })
  @IsString()
  @MaxLength(200)
  title!: string;
}

export class UpdateCvVersionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
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
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl(
    { protocols: ["https"], require_protocol: true },
    { message: "photoUrl must be a valid HTTPS URL" }
  )
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  github?: string;
}

export class CreateCvSectionDto {
  @ApiProperty({ example: "Custom Section" })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: "" })
  @IsString()
  @IsOptional()
  @MaxLength(15000)
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
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(15000)
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
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  sectionIds!: string[];
}

export class AiGenerateCvSectionDto {
  @ApiProperty({ enum: ["generate", "improve", "tailor"] })
  @IsIn(["generate", "improve", "tailor"])
  action!: "generate" | "improve" | "tailor";

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({
    example: "We are looking for a Senior Frontend Engineer...",
  })
  @IsString()
  @IsOptional()
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
  @IsString()
  @IsOptional()
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({
    example:
      "We are looking for a Senior Frontend Engineer with 5+ years of experience...",
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  jobDescription?: string;
}
