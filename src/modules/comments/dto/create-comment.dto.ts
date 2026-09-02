import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';
import {Transform} from "class-transformer";

export class CreateCommentDto {
    @ApiProperty({
        example: 'Great route! I would love to visit these places.',
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