import { ApiProperty } from '@nestjs/swagger';

export class RouteListAuthorResponseDto {
    @ApiProperty({ example: 2 })
    id: number;

    @ApiProperty({ example: 'Timofey' })
    name: string;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    avatarUrl: string | null;
}

export class RouteListItemResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'Trip to Italy' })
    title: string;

    @ApiProperty({ example: 'trip-to-italy' })
    slug: string;

    @ApiProperty({
        example: 'Summer road trip through Italy',
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    coverUrl: string | null;

    @ApiProperty({
        type: RouteListAuthorResponseDto,
    })
    author: RouteListAuthorResponseDto;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    totalDistanceMeters: number | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    totalDurationSeconds: number | null;

    @ApiProperty({ example: 5 })
    stopsCount: number;

    @ApiProperty({ example: 12 })
    likesCount: number;

    @ApiProperty({ example: 3 })
    commentsCount: number;

    @ApiProperty({
        example: '2026-08-27T10:00:00.000Z',
    })
    createdAt: Date;
}