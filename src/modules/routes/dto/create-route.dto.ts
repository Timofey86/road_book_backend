import {ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, MaxLength} from "class-validator";
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

    @ApiPropertyOptional({
        example: ['Italy', 'Mountains', 'Culture'],
        type: [String],
        maxItems: 10,
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    @MaxLength(50, { each: true })
    tags?: string[];
}