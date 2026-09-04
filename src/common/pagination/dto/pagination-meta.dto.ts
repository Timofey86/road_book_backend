import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
    @ApiProperty({
        example: 1,
    })
    page: number;

    @ApiProperty({
        example: 20,
    })
    limit: number;

    @ApiProperty({
        example: 43,
    })
    totalItems: number;

    @ApiProperty({
        example: 3,
    })
    totalPages: number;
}
