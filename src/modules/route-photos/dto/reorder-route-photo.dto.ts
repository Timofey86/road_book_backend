import { ApiProperty } from '@nestjs/swagger';
import {
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsInt,
} from 'class-validator';

export class ReorderRoutePhotosDto {
    @ApiProperty({
        example: [3, 1, 4],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsInt({ each: true })
    photoIds: number[];
}