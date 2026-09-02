import {ApiProperty} from "@nestjs/swagger";
import {TagResponseDto} from "../../tags/response/tag-response.dto";
import {RouteStopResponseDto} from "../../route-stops/response/route-stop-response.dto";
import {RoutePhotoResponseDto} from "../../route-photos/response/route-photos-response.dto";

export class RouteAuthorResponseDto {
    @ApiProperty({ example: 2 })
    id: number;

    @ApiProperty({ example: 'Timofey' })
    name: string;

    @ApiProperty({
        example: 'http://localhost:9000/roadbook/avatars/2/avatar.webp',
        nullable: true,
    })
    avatarUrl: string | null;
}

export class RouteDetailsResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 2 })
    userId: number;

    @ApiProperty({ example: 'Trip to Italy' })
    title: string;

    @ApiProperty({ example: 'trip-to-italy' })
    slug: string;

    @ApiProperty({
        example: 'Summer road trip',
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        example: 'http://localhost:9000/roadbook/routes/1/cover.webp',
        nullable: true,
    })
    coverUrl: string | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    totalDistanceMeters: number | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    totalDurationSeconds: number | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    routeGeometry: object | null;

    @ApiProperty({
        example: null,
        nullable: true,
    })
    routeBuiltAt: Date | null;

    @ApiProperty({ example: false })
    isRouteActual: boolean;

    @ApiProperty({
        type: RouteAuthorResponseDto,
    })
    author: RouteAuthorResponseDto;

    @ApiProperty({
        type: [RouteStopResponseDto],
    })
    stops: RouteStopResponseDto[];

    @ApiProperty({
        type: [TagResponseDto],
    })
    tags: TagResponseDto[];

    @ApiProperty({
        type: [RoutePhotoResponseDto],
    })
    photos: RoutePhotoResponseDto[];

    @ApiProperty({ example: 0 })
    likesCount: number;

    @ApiProperty({ example: false })
    isLiked: boolean;

    @ApiProperty({ example: false })
    isFavorite: boolean;

    @ApiProperty({ example: 0 })
    commentsCount: number;

    @ApiProperty({
        example: '2026-08-16T12:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-08-16T12:00:00.000Z',
    })
    updatedAt: Date;
}