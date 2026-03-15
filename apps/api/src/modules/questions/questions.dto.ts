import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsIn,
  ArrayMaxSize,
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

/** Exhaustive list of tags the client may filter by.
 *  Keeping this closed prevents attackers cycling infinite unique tag combos
 *  to manufacture fresh filterHashes and bypass the AI generation cooldown. */
export const ALLOWED_PRACTICE_TAGS = [
  // Languages
  "typescript", "javascript", "python", "java", "csharp", "go", "rust", "php",
  // Frontend
  "react", "angular", "vue", "svelte", "nextjs", "nuxt", "remix",
  "html", "css", "accessibility", "performance",
  // Backend
  "nestjs", "express", "fastify", "dotnet", "spring", "django", "fastapi",
  "rest", "graphql", "grpc", "websockets",
  // Databases & ORMs
  "postgres", "mysql", "sqlserver", "mongodb", "redis", "dynamodb",
  "prisma", "typeorm", "efcore", "hibernate",
  // Cloud / Infra / DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "serverless",
  "github-actions", "gitlab-ci", "azure-devops", "iac",
  // Observability / Security
  "logging", "metrics", "tracing", "opentelemetry", "sentry",
  "jwt", "oauth", "oidc", "owasp", "rbac", "encryption",
  // System design
  "scaling", "caching", "queues", "consistency", "distributed-systems",
  // General
  "algorithms", "data-structures", "oop", "functional", "testing", "ci-cd",
] as const;

export type AllowedPracticeTag = (typeof ALLOWED_PRACTICE_TAGS)[number];

export class PracticeNextDto {
  @ApiPropertyOptional({ enum: ["frontend", "backend", "fullstack", "devops"] })
  @IsOptional()
  @IsIn(["frontend", "backend", "fullstack", "devops"])
  track?: string;

  @ApiPropertyOptional({ enum: ["junior", "mid", "senior"] })
  @IsOptional()
  @IsIn(["junior", "mid", "senior"])
  level?: string;

  @ApiPropertyOptional({ enum: ["easy", "medium", "hard"] })
  @IsOptional()
  @IsIn(["easy", "medium", "hard"])
  difficulty?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 3, description: "Max 3 tags from the allowed list" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(ALLOWED_PRACTICE_TAGS, { each: true })
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
