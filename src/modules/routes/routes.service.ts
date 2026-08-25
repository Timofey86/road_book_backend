import {Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {CreateRouteDto} from "./dto/create-route.dto";
import slugify from "slugify";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";
import {RouteDetailsResponseDto} from "./response/route-details-response.dto";
import {StorageService} from "../storage/storage.service";
import {RouteDetailsEntity} from "./types/route-prisma.types";

@Injectable()
export class RoutesService {
    constructor(private readonly prismaService: PrismaService,
                private readonly storageService: StorageService) {}

    async create(userId: number, dto: CreateRouteDto):Promise<RouteCreatedResponseDto> {
        const title = dto.title.trim();
        const slug = await this.generateUniqueSlug(userId, title);
        return this.prismaService.route.create({
            data: {
                userId,
                title,
                slug,
                description: dto.description?.trim(),
            },
            include: {
                stops: true,
            },
        });
    }

    private async generateUniqueSlug(userId: number, title: string):Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (
            await this.prismaService.route.findUnique({
                where: {
                    userId_slug: {
                        userId,
                        slug,
                    },
                },
            })
            ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    async findOne(routeId: number, currentUserId: number): Promise<RouteDetailsResponseDto> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarObjectKey: true,
                    },
                },

                stops: {
                    orderBy: {
                        position: 'asc',
                    },
                },

                photos: true,

                likes: {
                    where: {
                        userId: currentUserId,
                    },
                    select: {
                        userId: true,
                    },
                },

                favorites: {
                    where: {
                        userId: currentUserId,
                    },
                    select: {
                        userId: true,
                    },
                },

                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        return this.mapRouteDetailsResponse(route);
    }

    private async getOptionalSignedUrl(
        objectKey: string | null,
    ): Promise<string | null> {
        if (!objectKey) {
            return null;
        }

        return this.storageService.getSignedUrl(objectKey);
    }

    private async mapRouteDetailsResponse(
        route: RouteDetailsEntity,
    ): Promise<RouteDetailsResponseDto> {
        const [coverUrl, avatarUrl, photos] = await Promise.all([
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

            stops: route.stops,
            photos,

            likesCount: route._count.likes,
            isLiked: route.likes.length > 0,
            isFavorite: route.favorites.length > 0,
            commentsCount: route._count.comments,

            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
        };
    }
}
