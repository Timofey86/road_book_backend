import {Injectable} from "@nestjs/common";
import {StorageService} from "../../storage/storage.service";
import {RouteStopResponseDto} from "../../route-stops/response/route-stop-response.dto";
import {RouteStop, Tag} from "../../../generated/prisma/client";
import {TagResponseDto} from "../../tags/response/tag-response.dto";
import {RouteDetailsEntity, RouteListEntity, RouteMutationEntity} from "../types/route-prisma.types";
import {RouteListItemResponseDto} from "../response/route-list-item-response.dto";
import {RouteResponseDto} from "../response/route-response.dto";
import {RouteDetailsResponseDto} from "../response/route-details-response.dto";

@Injectable()
export class RouteMapper {
    constructor(
        private readonly storageService: StorageService,
    ) {}

    mapRouteStop(stop: RouteStop): RouteStopResponseDto {
        return {
            ...stop,
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
        };
    }

    mapTag(tag: Tag): TagResponseDto {
        return {
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
        };
    }

    async mapRouteResponse(
        route: RouteMutationEntity,
    ): Promise<RouteResponseDto> {
        const coverUrl =
            await this.getOptionalSignedUrl(
                route.coverObjectKey,
            );

        return {
            id: route.id,
            userId: route.userId,
            title: route.title,
            slug: route.slug,
            description: route.description,
            coverUrl,
            totalDistanceMeters: route.totalDistanceMeters,
            totalDurationSeconds: route.totalDurationSeconds,
            isRouteActual: route.isRouteActual,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,

            stops: route.stops.map((stop) =>
                this.mapRouteStop(stop),
            ),

            tags: route.routeTags.map(({ tag }) =>
                this.mapTag(tag),
            ),
        };
    }

    async mapRouteDetailsResponse(
        route: RouteDetailsEntity,
    ): Promise<RouteDetailsResponseDto> {
        const [
            coverUrl,
            avatarUrl,
            photos,
        ] = await Promise.all([
            this.getOptionalSignedUrl(route.coverObjectKey),
            this.getOptionalSignedUrl(route.user.avatarObjectKey),

            Promise.all(
                route.photos.map(async (photo) => ({
                    id: photo.id,
                    url: await this.getOptionalSignedUrl(photo.objectKey),
                })),
            ),
        ]);

        return {
            id: route.id,
            userId: route.userId,
            title: route.title,
            slug: route.slug,
            description: route.description,
            coverUrl,
            totalDistanceMeters: route.totalDistanceMeters,
            totalDurationSeconds: route.totalDurationSeconds,
            routeGeometry: route.routeGeometry as object | null,
            routeBuiltAt: route.routeBuiltAt,
            isRouteActual: route.isRouteActual,
            author: {
                id: route.user.id,
                name: route.user.name,
                avatarUrl,
            },
            stops: route.stops.map((stop) =>
                this.mapRouteStop(stop),
            ),
            tags: route.routeTags.map(({ tag }) =>
                this.mapTag(tag),
            ),
            photos,
            likesCount: route._count.likes,
            isLiked: route.likes.length > 0,
            isFavorite: route.favorites.length > 0,
            commentsCount: route._count.comments,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
        };
    }

    async mapRouteListItemResponse(
        route: RouteListEntity,
    ): Promise<RouteListItemResponseDto> {
        const [
            coverUrl,
            avatarUrl,
        ] = await Promise.all([
            this.getOptionalSignedUrl(route.coverObjectKey),
            this.getOptionalSignedUrl(route.user.avatarObjectKey),
        ]);

        return {
            id: route.id,
            title: route.title,
            slug: route.slug,
            description: route.description,
            coverUrl,
            author: {
                id: route.user.id,
                name: route.user.name,
                avatarUrl,
            },
            totalDistanceMeters:  route.totalDistanceMeters,
            totalDurationSeconds: route.totalDurationSeconds,
            stopsCount: route._count.stops,
            likesCount: route._count.likes,
            commentsCount: route._count.comments,
            createdAt: route.createdAt,
        };
    }

    private async getOptionalSignedUrl(
        objectKey: string | null,
    ): Promise<string | null> {
        if (!objectKey) {
            return null;
        }

        return this.storageService.getSignedUrl(objectKey);
    }
}