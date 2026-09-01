import {
    ArrayMaxSize,
    IsArray,
    IsString,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRouteTagsDto {
    @ApiProperty({
        example: ['Italy', 'Mountains', 'Culture'],
        type: [String],
        maxItems: 10,
    })
    @IsArray()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(50, { each: true })
    tags: string[];
}