import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";

@Injectable()
export class FavoritesRepository {
    constructor(private readonly prismaService: PrismaService) {
    }

    findRoute(routeId: number) {
        return this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
            }
        })
    }

    find(userId: number, routeId: number) {
        return this.prismaService.favorite.findUnique({
            where: {
                userId_routeId: {
                    userId,
                    routeId
                }
            }
        })
    }

    create(userId: number, routeId: number) {
        return this.prismaService.favorite.create({
            data: {
                userId,
                routeId
            }
        })
    }

    delete(userId: number, routeId: number) {
        return this.prismaService.favorite.delete({
            where: {
                userId_routeId: {
                    userId,
                    routeId
                }
            }
        })
    }

    findAllByUser(userId: number, skip: number, take: number) {
        return this.prismaService.favorite.findMany({
            where: {
                userId,
            },
            include: {
                route: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarObjectKey: true
                            }
                        },
                        _count: {
                            select: {
                                stops: true,
                                likes: true,
                                comments: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take
        })
    }

    countByUser(userId: number): Promise<number> {
        return this.prismaService.favorite.count({
            where: {
                userId,
            }
        })
    }
}