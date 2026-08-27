import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional} from '@nestjs/swagger';

export class UpdateRouteDto {
    @ApiPropertyOptional({
        example: 'Italy Summer Road Trip',
        maxLength: 150,
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    title?: string;

    @ApiPropertyOptional({
        example: 'Updated description',
    })
    @IsOptional()
    @IsString()
    description?: string;
}