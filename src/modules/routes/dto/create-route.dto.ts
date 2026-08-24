import {IsNotEmpty, IsOptional, IsString, MaxLength} from "class-validator";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class CreateRouteDto {
    @ApiProperty({
        example: 'Trip to Italy',
        maxLength: 150,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @ApiPropertyOptional({
        example: 'Summer road trip through northern Italy',
    })
    @IsOptional()
    @IsString()
    description?: string;
}