import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import {
  collapseWhitespace,
  MAX_DISPLAY_NAME_LENGTH,
} from "../auth/user-profile";

export class UpdateProfileDto {
  @ApiProperty({ minLength: 1, maxLength: MAX_DISPLAY_NAME_LENGTH })
  @Transform(({ value }) =>
    typeof value === "string" ? collapseWhitespace(value) : value,
  )
  @IsString()
  @MinLength(1, { message: "Name is required" })
  @MaxLength(MAX_DISPLAY_NAME_LENGTH, {
    message: `Name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`,
  })
  @Matches(/^[^\p{Cc}]*$/u, { message: "Name contains invalid characters" })
  name!: string;
}

export class DeleteAccountDto {
  /** Must equal the account email (case-insensitive). */
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  confirmEmail!: string;
}
