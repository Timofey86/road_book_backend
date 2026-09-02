import { ApiProperty } from '@nestjs/swagger';

export class RoutePhotoResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 5 })
    routeId: number;

    @ApiProperty({
        example: 'http://localhost:9000/...',
    })
    url: string;

    @ApiProperty({
        example: 'View from the Alps',
        nullable: true,
    })
    caption: string | null;

    @ApiProperty({ example: 1 })
    position: number;

    @ApiProperty({
        example: '2026-09-01T10:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-09-01T10:00:00.000Z',
    })
    updatedAt: Date;
}