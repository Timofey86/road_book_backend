import { ApiProperty } from '@nestjs/swagger';
import { RouteListItemResponseDto } from '../../routes/response/route-list-item-response.dto';
import { PaginationMetaDto } from '../../../common/pagination/response/pagination-meta.dto';

export class FavoritesPaginatedResponseDto {
    @ApiProperty({
        type: [RouteListItemResponseDto],
    })
    items: RouteListItemResponseDto[];

    @ApiProperty({
        type: PaginationMetaDto,
    })
    meta: PaginationMetaDto;
}