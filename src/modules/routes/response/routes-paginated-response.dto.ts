import { ApiProperty } from '@nestjs/swagger';
import { RouteListItemResponseDto } from './route-list-item-response.dto';
import {PaginatedResponseDto} from "../../../common/pagination/response/paginated-response.dto";

export class RoutesPaginatedResponseDto
    extends PaginatedResponseDto<RouteListItemResponseDto> {
    @ApiProperty({
        type: [RouteListItemResponseDto],
    })
    declare items: RouteListItemResponseDto[];
}