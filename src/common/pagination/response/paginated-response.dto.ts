import {PaginationMetaDto} from "./pagination-meta.dto";
import {ApiProperty} from "@nestjs/swagger";

export class PaginatedResponseDto<T> {
    items: T[];
    @ApiProperty({
        type: PaginationMetaDto,
    })
    meta: PaginationMetaDto;
}