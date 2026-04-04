import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
  IsUrl,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const JOB_STATUSES = [
  // Current pipeline statuses
  "wishlist",
  "applied",
  "phone_screen",
  "technical_interview",
  "onsite",
  "tech_test",
  "accepted",
  "rejected",
  // Legacy statuses accepted for backward compatibility
  "saved",
  "interview",
  "offer",
  "ghosted",
] as const;

export class CreateJobDto {
  @ApiProperty({ example: "Acme Corp" })
  @IsString()
  @MaxLength(200)
  company!: string;

  @ApiProperty({ example: "Frontend Developer" })
  @IsString()
  @MaxLength(200)
  role!: string;

  @ApiPropertyOptional({
    example: "applied",
    enum: JOB_STATUSES,
  })
  @IsString()
  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.url && o.url.trim().length > 0)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2000)
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  cvVersionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  coverLetterId?: string;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ example: "Acme Corp" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ example: "Frontend Developer" })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  role?: string;

  @ApiPropertyOptional({
    example: "applied",
    enum: JOB_STATUSES,
  })
  @IsString()
  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.url && o.url.trim().length > 0)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @MaxLength(2000)
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  cvVersionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  coverLetterId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
