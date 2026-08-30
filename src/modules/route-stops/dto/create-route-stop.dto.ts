import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsNotEmpty, IsNumber, IsOptional, IsString, Length, MaxLength} from "class-validator";

export class CreateRouteStopDto {
    @ApiProperty({
        example: 'Milan',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @ApiProperty({
        example: 'Milan, Lombardy, Italy',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    address?: string;

    @ApiPropertyOptional({
        example: 'Milan',
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    cityName?: string;

    @ApiPropertyOptional({
        example: 'Italy',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    countryName?: string;

    @ApiPropertyOptional({
        example: 'IT',
    })
    @IsOptional()
    @IsString()
    @Length(2, 2)
    countryCode?: string;

    @ApiProperty({
        example: 45.4642,
    })
    @IsNumber()
    latitude: number;

    @ApiProperty({
        example: 9.19,
    })
    @IsNumber()
    longitude: number;

    @ApiPropertyOptional({
        example: 'Start of the trip',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}