import { IsString, IsOptional, IsIn, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCoverLetterDto {
  @ApiProperty({ example: "My Cover Letter" })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: "Dear Hiring Manager..." })
  @IsString()
  @IsOptional()
  @MaxLength(15000)
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
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(15000)
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
  @MaxLength(200)
  jobTitle?: string;

  @ApiPropertyOptional({ example: "Acme Corp" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional({ example: "https://acme.com" })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  companyUrl?: string;

  @ApiPropertyOptional({ example: "We are looking for..." })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  jobDescription?: string;

  @ApiPropertyOptional({ enum: ["professional", "friendly"] })
  @IsIn(["professional", "friendly"])
  @IsOptional()
  tone?: "professional" | "friendly";
}
