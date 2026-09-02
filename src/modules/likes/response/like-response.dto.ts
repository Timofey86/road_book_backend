import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
    @ApiProperty({
        example: 5,
    })
    routeId: number;

    @ApiProperty({
        example: true,
    })
    isLiked: boolean;

    @ApiProperty({
        example: 12,
    })
    likesCount: number;
}