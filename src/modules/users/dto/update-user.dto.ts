import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { PreferredLanguage } from '../../../generated/prisma/enums';
import {ApiProperty} from "@nestjs/swagger";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ApiProperty({ example: 'John Doe', nullable: true })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    @ApiProperty({ example: 'road trip enthusiast', nullable: true })
    bio?: string;

    @IsOptional()
    @IsEnum(PreferredLanguage)
    @ApiProperty({
        example: "ru\": \"ru",
        nullable: true,
    })
    preferredLanguage?: PreferredLanguage;
}