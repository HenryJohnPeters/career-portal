import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateInterviewSessionDto {
  @ApiProperty({ enum: ["frontend", "backend", "fullstack", "devops"] })
  @IsString()
  @IsIn(["frontend", "backend", "fullstack", "devops"])
  track!: string;

  @ApiProperty({ enum: ["junior", "mid", "senior"] })
  @IsString()
  @IsIn(["junior", "mid", "senior"])
  level!: string;

  @ApiProperty({ type: [String], example: ["react", "typescript"] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags!: string[];

  @ApiPropertyOptional({
    enum: ["frontend", "backend", "fullstack", "platform"],
    default: "fullstack",
  })
  @IsOptional()
  @IsString()
  roleFocus?: string;

  @ApiPropertyOptional({
    enum: ["coding", "system-design", "behavioral"],
    default: "coding",
  })
  @IsOptional()
  @IsString()
  interviewType?: string;

  @ApiPropertyOptional({ enum: [30, 60, 90], default: 60 })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional({ enum: ["easy", "medium", "hard"], default: "medium" })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    enum: ["faang", "startup", "enterprise"],
    default: "startup",
  })
  @IsOptional()
  @IsString()
  companyStyle?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(25)
  questionCount?: number;

  @ApiPropertyOptional({
    enum: ["friendly", "neutral", "tough"],
    default: "neutral",
  })
  @IsOptional()
  @IsString()
  @IsIn(["friendly", "neutral", "tough"])
  persona?: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(10000)
  answer!: string;
}
