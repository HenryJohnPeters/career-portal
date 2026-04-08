import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class VerifyCheckoutSessionDto {
  @ApiProperty({
    description: "Stripe Checkout session ID (starts with cs_)",
    example: "cs_test_a1b2c3d4e5f6",
  })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @Matches(/^cs_[a-zA-Z0-9_]+$/)
  sessionId!: string;
}
