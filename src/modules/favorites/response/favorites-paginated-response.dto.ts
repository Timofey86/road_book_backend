import { ApiProperty } from '@nestjs/swagger';
import { RouteListItemResponseDto } from '../../routes/response/route-list-item-response.dto';

export class FavoritesPaginatedResponseDto {
    @ApiProperty({
        type: [RouteListItemResponseDto],
    })
    items: RouteListItemResponseDto[];

    @ApiProperty({
        example: 12,
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