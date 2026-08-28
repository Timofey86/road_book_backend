import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/pagination/dto/pageination-query.dto';

export enum RouteSortBy {
    CREATED_AT = 'createdAt',
    LIKES = 'likes',
    DISTANCE = 'distance',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class RoutesQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        example: 'Italy',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        enum: RouteSortBy,
        default: RouteSortBy.CREATED_AT,
    })
    @IsOptional()
    @IsEnum(RouteSortBy)
    sortBy: RouteSortBy = RouteSortBy.CREATED_AT;

    @ApiPropertyOptional({
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({
        example: 100000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minDistance?: number;

    @ApiPropertyOptional({
        example: 1000000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxDistance?: number;

    @ApiPropertyOptional({
        example: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    stopsCount?: number;
}