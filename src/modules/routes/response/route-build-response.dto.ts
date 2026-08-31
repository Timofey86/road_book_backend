import {ApiProperty} from "@nestjs/swagger";

export class RouteBuildGeometryDto {
    @ApiProperty({
        example: 'LineString',
    })
    type: 'LineString';

    @ApiProperty({
        description: 'Route geometry coordinates in [longitude, latitude] format',
        example: [
            [9.189254, 45.464909],
            [9.189254, 45.465141],
        ],
        type: 'array',
        items: {
            type: 'array',
            items: {
                type: 'number',
            },
        },
    })
    coordinates: [number, number][];
}

export class RouteBuildResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({
        example: 165867,
        description: 'Total route distance in meters',
    })
    totalDistanceMeters: number;

    @ApiProperty({
        example: 6925,
        description: 'Total route duration in seconds',
    })
    totalDurationSeconds: number;

    @ApiProperty({
        type: RouteBuildGeometryDto,
    })
    routeGeometry: RouteBuildGeometryDto;

    @ApiProperty({
        example: '2026-08-31T10:30:00.000Z',
    })
    routeBuiltAt: Date;

    @ApiProperty({
        example: true,
    })
    isRouteActual: boolean;
}