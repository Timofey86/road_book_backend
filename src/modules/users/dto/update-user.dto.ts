import {
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { PreferredLanguage } from '../../../generated/prisma/enums';
import { ApiPropertyOptional} from "@nestjs/swagger";

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    @ApiPropertyOptional({ example: 'John Doe', nullable: true })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    @ApiPropertyOptional({ example: 'Road trip enthusiast', nullable: true })
    bio?: string;

    @IsOptional()
    @IsEnum(PreferredLanguage)
    @ApiPropertyOptional({
        enum: PreferredLanguage,
        example: PreferredLanguage.ru,
        nullable: true,
    })
    preferredLanguage?: PreferredLanguage;
}