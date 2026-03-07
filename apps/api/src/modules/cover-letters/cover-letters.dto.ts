import { IsString, IsOptional, IsIn } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCoverLetterDto {
  @ApiProperty({ example: "My Cover Letter" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: "Dear Hiring Manager..." })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  jobId?: string;
}

export class UpdateCoverLetterDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  jobId?: string;
}

export class RewriteDto {
  @ApiPropertyOptional({ enum: ["professional", "friendly"] })
  @IsIn(["professional", "friendly"])
  @IsOptional()
  tone?: "professional" | "friendly";
}

export class AiGenerateCoverLetterDto {
  @ApiProperty({ enum: ["generate", "improve", "tailor"] })
  @IsIn(["generate", "improve", "tailor"])
  action!: "generate" | "improve" | "tailor";

  @ApiPropertyOptional({ example: "Senior Frontend Engineer" })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiPropertyOptional({ example: "Acme Corp" })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: "https://acme.com" })
  @IsString()
  @IsOptional()
  companyUrl?: string;

  @ApiPropertyOptional({ example: "We are looking for..." })
  @IsString()
  @IsOptional()
  jobDescription?: string;

  @ApiPropertyOptional({ enum: ["professional", "friendly"] })
  @IsIn(["professional", "friendly"])
  @IsOptional()
  tone?: "professional" | "friendly";
}
