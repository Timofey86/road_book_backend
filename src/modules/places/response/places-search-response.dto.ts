import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class PlaceSearchResponseDto {
    @ApiProperty({
        example: 'Milan',
    })
    name: string;

    @ApiPropertyOptional({
        example: 'Milan, MI, Italy',
        nullable: true,
    })
    address: string | null;

    @ApiPropertyOptional({
        example: 'Milan',
        nullable: true,
    })
    cityName: string | null;

    @ApiPropertyOptional({
        example: 'Italy',
        nullable: true,
    })
    countryName: string | null;

    @ApiPropertyOptional({
        example: 'IT',
        nullable: true,
    })
    countryCode: string | null;

    @ApiProperty({
        example: 45.473702,
    })
    latitude: number;

    @ApiProperty({
        example: 9.170685,
    })
    longitude: number;
}