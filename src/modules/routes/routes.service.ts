import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {CreateRouteDto} from "./dto/create-route.dto";
import slugify from "slugify";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";
import {RouteDetailsResponseDto} from "./response/route-details-response.dto";
import {StorageService} from "../storage/storage.service";
import {RouteDetailsEntity, RouteListEntity} from "./types/route-prisma.types";
import {UpdateRouteDto} from "./dto/update-route.dto";
import {RoutesPaginatedResponseDto} from "./response/routes-paginated-response.dto";
import {RouteListItemResponseDto} from "./response/route-list-item-response.dto";

@Injectable()
export class RoutesService {
    constructor(private readonly prismaService: PrismaService,
                private readonly storageService: StorageService) {
    }

    async create(userId: number, dto: CreateRouteDto): Promise<RouteCreatedResponseDto> {
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

    private async generateUniqueSlug(userId: number, title: string, excludeRouteId?: number): Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (
            await this.prismaService.route.findFirst({
                where: {
                    userId,
                    slug,
                    ...(excludeRouteId && {
                        id: {
                            not: excludeRouteId,
                        },
                    }),
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

    async update(
        routeId: number,
        currentUserId: number,
        dto: UpdateRouteDto,
    ): Promise<RouteCreatedResponseDto> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true,
                title: true
            }
        })

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException('You cannot edit this route');
        }

        const title = dto.title?.trim();

        const slug = title
            ? await this.generateUniqueSlug(currentUserId, title, routeId)
            : undefined;

        return this.prismaService.route.update({
            where: {
                id: routeId
            },
            data: {
                title,
                slug,
                description: dto.description?.trim()
            },
            include: {
                stops: true
            }
        })
    }

    async remove(routeId: number, currentUserId: number): Promise<void> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true,
                coverObjectKey: true,
                photos: {
                    select: {
                        objectKey: true,
                    },
                },
            },
        });

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException('You cannot delete this route');
        }

        const objectKeys = [
            route.coverObjectKey,
            ...route.photos.map(photo => photo.objectKey),
        ].filter((key): key is string => key !== null);

        await this.prismaService.route.delete({
            where: {
                id: routeId,
            },
        });

        const results = await Promise.allSettled(
            objectKeys.map(objectKey =>
                this.storageService.delete(objectKey),
            ),
        );

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(
                    `Failed to delete file: ${objectKeys[index]}`,
                    result.reason,
                );
            }
        });
    }

    async getRoutesByUser(
        currentUserId: number,
        page: number,
        limit: number
    ): Promise<RoutesPaginatedResponseDto> {
        const skip = (page - 1) * limit;
        const [routes, totalItems] = await Promise.all([
            this.prismaService.route.findMany({
                where: {
                    userId: currentUserId,
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatarObjectKey: true,
                        },
                    },
                    _count: {
                        select: {
                            stops: true,
                            likes: true,
                            comments: true,
                        },
                    },
                },
            }),
            this.prismaService.route.count({
                where: {
                    userId: currentUserId,
                },
            }),
        ])

        const avatarUrl = routes[0]?.user.avatarObjectKey
            ? await this.storageService.getSignedUrl(
                routes[0].user.avatarObjectKey,
            )
            : null;

        const items = await Promise.all(
            routes.map(route => this.mapRouteListItemResponse(route, avatarUrl)),
        );

        return {
            items,
            meta: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        };
    }

    private async mapRouteListItemResponse(
        route: RouteListEntity,
        avatarUrl?: string | null,
    ): Promise<RouteListItemResponseDto> {
        const coverUrl = await this.getOptionalSignedUrl(
            route.coverObjectKey,
        );

        return {
            id: route.id,
            title: route.title,
            slug: route.slug,
            description: route.description,
            coverUrl,

            author: {
                id: route.user.id,
                name: route.user.name,
                avatarUrl:
                    avatarUrl !== undefined
                        ? avatarUrl
                        : await this.getOptionalSignedUrl(
                            route.user.avatarObjectKey,
                        ),
            },

            totalDistanceMeters: route.totalDistanceMeters,
            totalDurationSeconds: route.totalDurationSeconds,
            stopsCount: route._count.stops,
            likesCount: route._count.likes,
            commentsCount: route._count.comments,
            createdAt: route.createdAt,
        };
    }
}
