import { ApiProperty } from '@nestjs/swagger';

export class RouteStopResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 15 })
    routeId: number;

    @ApiProperty({ example: 'Milan' })
    name: string;

    @ApiProperty({
        example: 'Milan, Lombardy, Italy',
        nullable: true,
    })
    address: string | null;

    @ApiProperty({ example: 45.4642 })
    latitude: number;

    @ApiProperty({
        example: 'Milan',
        nullable: true
    })
    cityName: string | null;

    @ApiProperty({
        example: 'Italy',
        nullable: true
    })
    countryName: string | null;

    @ApiProperty({
        example: 'IT',
        nullable: true
    })
    countryCode: string | null;

    @ApiProperty({ example: 9.19 })
    longitude: number;

    @ApiProperty({ example: 1 })
    position: number;

    @ApiProperty({
        example: 'Start of the trip',
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        example: '2026-08-28T10:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-08-28T10:00:00.000Z',
    })
    updatedAt: Date;
}