import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 12 })
    limit: number;

    @ApiProperty({ example: 45 })
    totalItems: number;

    @ApiProperty({ example: 4 })
    totalPages: number;
}
