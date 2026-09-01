import { ApiPropertyOptional } from '@nestjs/swagger';
import {IsOptional, IsString, MaxLength, MinLength} from 'class-validator';

export class TagsQueryDto {
    @ApiPropertyOptional({
        example: 'mount',
        description: 'Search tags by name',
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    search?: string;
}