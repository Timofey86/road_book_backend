import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadRoutePhotoDto {
    @ApiPropertyOptional({
        example: 'View from the Alps',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    caption?: string;
}