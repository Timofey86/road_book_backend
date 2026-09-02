import {PrismaService} from "../../../prisma/prisma.service";
import {Injectable} from "@nestjs/common";

@Injectable()
export class CommentsRepository {
    constructor(private readonly prismaService: PrismaService) {}

    findRoute(routeId: number) {
        return this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
            },
        });
    }

    create(
        routeId: number,
        userId: number,
        body: string,
    ) {
        return this.prismaService.comment.create({
            data: {
                routeId,
                userId,
                body,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarObjectKey: true,
                    },
                },
            },
        });
    }

    findById(commentId: number) {
        return this.prismaService.comment.findUnique({
            where: {
                id: commentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarObjectKey: true,
                    },
                },
            },
        });
    }

    findAllByRoute(
        routeId: number,
        skip: number,
        take: number,
    ) {
        return this.prismaService.comment.findMany({
            where: {
                routeId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarObjectKey: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip,
            take,
        });
    }

    countByRoute(routeId: number): Promise<number> {
        return this.prismaService.comment.count({
            where: {
                routeId,
            },
        });
    }

    update(
        commentId: number,
        body: string,
    ) {
        return this.prismaService.comment.update({
            where: {
                id: commentId,
            },
            data: {
                body,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarObjectKey: true,
                    },
                },
            },
        });
    }

    delete(commentId: number) {
        return this.prismaService.comment.delete({
            where: {
                id: commentId,
            },
        });
    }
}