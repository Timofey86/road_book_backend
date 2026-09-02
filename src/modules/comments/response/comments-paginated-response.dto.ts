import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';

export class CommentsPaginatedResponseDto {
    @ApiProperty({
        type: [CommentResponseDto],
    })
    items: CommentResponseDto[];

    @ApiProperty({
        example: 43,
    })
    total: number;

    @ApiProperty({
        example: 1,
    })
    page: number;

    @ApiProperty({
        example: 20,
    })
    limit: number;
}