import {ApiPropertyOptional} from "@nestjs/swagger";
import {IsNumber, IsOptional, IsString, Length, MaxLength} from "class-validator";

export class UpdateRouteStopDto {
    @ApiPropertyOptional({
        example: 'Milan',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @ApiPropertyOptional({
        example: 'Milan, Lombardy, Italy',
    })
    @IsOptional()
    @IsString()
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

    @ApiPropertyOptional({
        example: 45.4642,
    })
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({
        example: 9.19,
    })
    @IsOptional()
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({
        example: 'Updated stop description',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}