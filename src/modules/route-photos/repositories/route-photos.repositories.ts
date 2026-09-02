import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";

@Injectable()
export class RoutePhotosRepository {
    constructor(private readonly prismaService: PrismaService) {}

    findRouteForOwnership(routeId: number) {
        return this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true,
            },
        });
    }

    countByRoute(routeId: number): Promise<number> {
        return this.prismaService.routePhoto.count({
            where: {
                routeId,
            },
        });
    }

    findLastPosition(routeId: number) {
        return this.prismaService.routePhoto.findFirst({
            where: {
                routeId,
            },
            orderBy: {
                position: 'desc',
            },
            select: {
                position: true,
            },
        });
    }

    create(
        routeId: number,
        objectKey: string,
        caption: string | null,
        position: number,
    ) {
        return this.prismaService.routePhoto.create({
            data: {
                routeId,
                objectKey,
                caption,
                position,
            },
        });
    }

    findById(
        routeId: number,
        photoId: number,
    ) {
        return this.prismaService.routePhoto.findFirst({
            where: {
                id: photoId,
                routeId,
            },
        });
    }

    findAllByRoute(routeId: number) {
        return this.prismaService.routePhoto.findMany({
            where: {
                routeId,
            },
            orderBy: {
                position: 'asc',
            },
        });
    }

    delete(photoId: number) {
        return this.prismaService.routePhoto.delete({
            where: {
                id: photoId,
            },
        });
    }

    async deleteAndShiftPositions(
        photoId: number,
        routeId: number,
        position: number,
    ) {
        return this.prismaService.$transaction(async (tx) => {
            const deletedPhoto = await tx.routePhoto.delete({
                where: {
                    id: photoId,
                },
            });

            await tx.routePhoto.updateMany({
                where: {
                    routeId,
                    position: {
                        gt: position,
                    },
                },
                data: {
                    position: {
                        decrement: 1,
                    },
                },
            });

            return deletedPhoto;
        });
    }

    updateCaption(
        photoId: number,
        caption: string | null,
    ) {
        return this.prismaService.routePhoto.update({
            where: {
                id: photoId,
            },
            data: {
                caption,
            },
        });
    }

    async reorder(
        routeId: number,
        photoIds: number[],
    ): Promise<void> {
        await this.prismaService.$transaction(
            async (tx) => {
                await tx.routePhoto.updateMany({
                    where: {
                        routeId,
                    },
                    data: {
                        position: {
                            increment: 1000,
                        },
                    },
                });

                for (let index = 0; index < photoIds.length; index++) {
                    await tx.routePhoto.update({
                        where: {
                            id: photoIds[index],
                        },
                        data: {
                            position: index + 1,
                        },
                    });
                }
            },
        );
    }
}

