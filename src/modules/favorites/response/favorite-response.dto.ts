import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
    @ApiProperty({
        example: 5,
    })
    routeId: number;

    @ApiProperty({
        example: true,
    })
    isFavorite: boolean;
}