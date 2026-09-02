import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";

@Injectable()
export class LikesRepository {
    constructor(
        private readonly prismaService: PrismaService,
    ) {
    }

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

    find(
        userId: number,
        routeId: number,
    ) {
        return this.prismaService.like.findUnique({
            where: {
                userId_routeId: {
                    userId,
                    routeId,
                },
            },
        });
    }

    create(
        userId: number,
        routeId: number,
    ) {
        return this.prismaService.like.create({
            data: {
                userId,
                routeId,
            },
        });
    }

    delete(
        userId: number,
        routeId: number,
    ) {
        return this.prismaService.like.delete({
            where: {
                userId_routeId: {
                    userId,
                    routeId,
                },
            },
        });
    }

    countByRoute(routeId: number): Promise<number> {
        return this.prismaService.like.count({
            where: {
                routeId,
            },
        });
    }
}