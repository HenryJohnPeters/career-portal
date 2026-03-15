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

export class CreateTechnicalTestDto {
  @ApiProperty({ enum: ["frontend", "backend", "fullstack", "platform"] })
  @IsString()
  @IsIn(["frontend", "backend", "fullstack", "platform"])
  roleFocus!: string;

  @ApiProperty({ enum: ["junior", "mid", "senior"] })
  @IsString()
  @IsIn(["junior", "mid", "senior"])
  level!: string;

  @ApiProperty({ enum: ["easy", "medium", "hard"] })
  @IsString()
  @IsIn(["easy", "medium", "hard"])
  difficulty!: string;

  @ApiProperty({ type: [String], example: ["React", "TypeScript"] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags!: string[];

  @ApiPropertyOptional({ default: 60, description: "Time limit in minutes" })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  timeLimit?: number;
}

export class SubmitTechnicalTestDto {
  @ApiProperty({ description: "The user's solution / submission text" })
  @IsString()
  @MaxLength(50000)
  submission!: string;
}
