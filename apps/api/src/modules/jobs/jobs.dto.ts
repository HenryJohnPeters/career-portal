import { IsString, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateJobDto {
  @ApiProperty({ example: "Acme Corp" })
  @IsString()
  company!: string;

  @ApiProperty({ example: "Frontend Developer" })
  @IsString()
  role!: string;

  @ApiPropertyOptional({ example: "applied" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cvVersionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverLetterId?: string;
}

export class UpdateJobDto {
  @ApiPropertyOptional({ example: "Acme Corp" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: "Frontend Developer" })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: "applied" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cvVersionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  coverLetterId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  followUpDate?: string;
}
