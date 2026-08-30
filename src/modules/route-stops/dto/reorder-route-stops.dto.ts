import { ApiProperty } from "@nestjs/swagger";
import {ArrayMinSize, IsArray, IsInt, Min, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class ReorderRouteStopItemDto {
    @ApiProperty({ example: 3 })
    @IsInt()
    @Min(1)
    id: number;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    position: number;
}

export class ReorderRouteStopsDto {
    @ApiProperty({
        type: [ReorderRouteStopItemDto],
        example: [
            { id: 3, position: 1 },
            { id: 1, position: 2 },
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReorderRouteStopItemDto)
    stops: ReorderRouteStopItemDto[];
}