import {ApiProperty} from "@nestjs/swagger";

export class RouteCreatedResponseDto {
    @ApiProperty({
        example: 1
    })
    id: number;

    @ApiProperty({
        example: 2
    })
    userId: number;

    @ApiProperty({
        example: 'Trip to Italy'
    })
    title: string;

    @ApiProperty({
        example: 'trip-to-italy'
    })
    slug: string;

    @ApiProperty(
        {
            example: 'it was best trip to Italy :)',
            nullable: true
        }
    )
    description: string | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    coverObjectKey: string | null;

    @ApiProperty({
        example: 10000,
        nullable: true,
    })
    totalDistanceMeters: number | null;

    @ApiProperty(
        {
            example: 20000,
            nullable: true,
        }
    )
    totalDurationSeconds: number | null;

    @ApiProperty(
        {
            example: false
        }
    )
    isRouteActual: boolean;

    @ApiProperty({example: '2026-08-16T12:00:00.000Z'})
    createdAt: Date;

    @ApiProperty({example: '2026-08-16T12:00:00.000Z'})
    updatedAt: Date;

    @ApiProperty({
        example: [],
        type: [Object],
    })
    stops: object[];
}