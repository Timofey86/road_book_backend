import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

export class UpdateCommentDto {
    @ApiProperty({
        example: 'Updated comment text',
        maxLength: 2000,
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    body: string;
}