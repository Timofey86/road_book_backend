import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';
import { PaginationMetaDto } from '../../../common/pagination/response/pagination-meta.dto';

export class CommentsPaginatedResponseDto {
    @ApiProperty({
        type: [CommentResponseDto],
    })
    items: CommentResponseDto[];

    @ApiProperty({
        type: PaginationMetaDto,
    })
    meta: PaginationMetaDto;
}