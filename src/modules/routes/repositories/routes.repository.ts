import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";
import {Prisma} from "../../../generated/prisma/client";

interface NormalizedTag {
    name: string;
    slug: string;
}

@Injectable()
export class RoutesRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) {
    }

    async existsByUserAndSlug(
        userId: number,
        slug: string,
        excludeRouteId?: number,
    ): Promise<boolean> {
        const route = await this.prisma.route.findFirst({
            where: {
                userId,
                slug,
                ...(excludeRouteId !== undefined && {
                    id: {
                        not: excludeRouteId,
                    },
                }),
            },
            select: {
                id: true,
            },
        });

        return route !== null;
    }

    create(
        userId: number,
        title: string,
        slug: string,
        description: string | null,
        tags: NormalizedTag[],
    ) {
        return this.prisma.route.create({
            data: {
                userId,
                title,
                slug,
                description,
                routeTags: {
                    create: tags.map((tag) => ({
                        tag: {
                            connectOrCreate: {
                                where: {
                                    slug: tag.slug,
                                },
                                create: {
                                    name: tag.name,
                                    slug: tag.slug,
                                },
                            },
                        },
                    })),
                },
            },

            include: {
                stops: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                routeTags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }

    findDetails(
        routeId: number,
        currentUserId?: number,
    ) {
        const userId = currentUserId ?? -1;

        return this.prisma.route.findUnique({
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
                photos: {
                    orderBy: {
                        position: 'asc',
                    },
                },
                routeTags: {
                    include: {
                        tag: true,
                    },
                },
                likes: {
                    where: {
                        userId,
                    },
                    select: {
                        userId: true,
                    },
                },
                favorites: {
                    where: {
                        userId,
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
    }

    findForOwnership(routeId: number) {
        return this.prisma.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true,
                title: true,
            },
        });
    }

    update(
        routeId: number,
        data: {
            title?: string;
            slug?: string;
            description?: string | null;
        },
    ) {
        return this.prisma.route.update({
            where: {
                id: routeId,
            },
            data,
            include: {
                stops: {
                    orderBy: {
                        position: 'asc',
                    },
                },

                routeTags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
    }

    findForDelete(routeId: number) {
        return this.prisma.route.findUnique({
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
    }

    delete(routeId: number) {
        return this.prisma.route.delete({
            where: {
                id: routeId,
            },
        });
    }

    findByUser(
        userId: number,
        skip: number,
        take: number,
    ) {
        return this.prisma.route.findMany({
            where: {
                userId,
            },
            skip,
            take,
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
        });
    }

    countByUser(userId: number): Promise<number> {
        return this.prisma.route.count({
            where: {
                userId,
            },
        });
    }

    findAll(
        where: Prisma.RouteWhereInput,
        orderBy: Prisma.RouteOrderByWithRelationInput[],
        skip: number,
        take: number,
    ) {
        return this.prisma.route.findMany({
            where,
            skip,
            take,
            orderBy,

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
        });
    }

    count(where: Prisma.RouteWhereInput): Promise<number> {
        return this.prisma.route.count({
            where,
        });
    }

    findForBuild(routeId: number) {
        return this.prisma.route.findUnique({
            where: {
                id: routeId,
            },
            include: {
                stops: {
                    orderBy: {
                        position: 'asc',
                    },
                },
            },
        });
    }

    updateBuildResult(
        routeId: number,
        data: {
            totalDistanceMeters: number;
            totalDurationSeconds: number;
            routeGeometry: Prisma.InputJsonValue;
            routeBuiltAt: Date;
            isRouteActual: boolean;
        },
    ) {
        return this.prisma.route.update({
            where: {
                id: routeId,
            },
            data,
            select: {
                id: true,
            },
        });
    }

    async replaceTags(
        routeId: number,
        tags: { name: string, slug: string }[]) {
        return this.prisma.$transaction(async (tx) => {
            await tx.routeTag.deleteMany({
                where: {
                    routeId,
                },
            });

                await Promise.all(
                    tags.map((tag) =>
                        tx.routeTag.create({
                            data: {
                                route: {
                                    connect: {
                                        id: routeId,
                                    }
                                },
                                tag: {
                                    connectOrCreate: {
                                        where: {
                                            slug: tag.slug,
                                        },
                                        create: {
                                            name: tag.name,
                                            slug: tag.slug,
                                        },
                                    },
                                },
                            },
                        }),
                    ),
                );


            return tx.route.findUniqueOrThrow({
                where: {
                    id: routeId,
                },
                include: {
                    stops: {
                        orderBy: {
                            position: 'asc',
                        },
                    },
                    routeTags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            });
        });
    }

    findForCover(routeId: number) {
        return this.prisma.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true,
                coverObjectKey: true,
            },
        });
    }

    updateCover(
        routeId: number,
        coverObjectKey: string,
    ) {
        return this.prisma.route.update({
            where: {
                id: routeId,
            },
            data: {
                coverObjectKey,
            },
            select: {
                id: true,
                coverObjectKey: true,
            },
        });
    }
}