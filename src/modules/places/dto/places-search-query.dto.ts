import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsString, MaxLength, MinLength} from "class-validator";

export class PlacesSearchQueryDto {
    @ApiProperty({
        example: 'Milan',
        description: 'Place search query',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(200)
    q: string;
}