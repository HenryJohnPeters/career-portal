import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
} from "class-validator";
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";

export class AnswerQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  skipped?: boolean;
}

export class PracticeNextDto {
  @ApiPropertyOptional({ enum: ["frontend", "backend", "fullstack", "devops"] })
  @IsOptional()
  @IsString()
  track?: string;

  @ApiPropertyOptional({ enum: ["junior", "mid", "senior"] })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ enum: ["easy", "medium", "hard"] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeIds?: string[];
}

export class PracticeCheckDto {
  @ApiProperty()
  @IsString()
  questionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  selectedOptionIndex?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  selectedOptionIndices?: number[];
}
