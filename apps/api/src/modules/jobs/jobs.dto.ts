import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
    enum: ["saved", "applied", "interview", "offer", "rejected", "ghosted"],
  })
  @IsString()
  @IsOptional()
  @IsIn(["saved", "applied", "interview", "offer", "rejected", "ghosted"])
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
    enum: ["saved", "applied", "interview", "offer", "rejected", "ghosted"],
  })
  @IsString()
  @IsOptional()
  @IsIn(["saved", "applied", "interview", "offer", "rejected", "ghosted"])
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
