import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateRoutePhotoDto {
    @ApiPropertyOptional({
        example: 'New caption',
        maxLength: 500,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    caption?: string | null;
}