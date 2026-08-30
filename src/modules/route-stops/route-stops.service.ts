import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CreateRouteStopDto} from "./dto/create-route-stop.dto";
import {RouteStopResponseDto} from "./response/route-stop-response.dto";
import type {RouteStop} from "../../generated/prisma/client";
import {PrismaService} from "../../prisma/prisma.service";
import {UpdateRouteStopDto} from "./dto/update-route-stop.dto";
import {ReorderRouteStopsDto} from "./dto/reorder-route-stops.dto";

@Injectable()
export class RouteStopsService {
    constructor(private readonly prismaService: PrismaService) {
    }

    async create(
        routeId: number,
        currentUserId: number,
        dto: CreateRouteStopDto
    ): Promise<RouteStopResponseDto> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true
            }
        })

        if (!route) {
            throw new NotFoundException('route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException(
                'You cannot modify this route',
            );
        }

        const stop = await this.prismaService.$transaction(
            async tx => {
                const stopsCount = await tx.routeStop.count({
                    where: {
                        routeId,
                    }
                })

                const createdStop = await tx.routeStop.create({
                    data: {
                        routeId,
                        name: dto.name,
                        address: dto.address,
                        cityName: dto.cityName,
                        countryName: dto.countryName,
                        countryCode: dto.countryCode,
                        latitude: dto.latitude,
                        longitude: dto.longitude,
                        position: stopsCount + 1,
                        description: dto.description,
                    }
                })

                await tx.route.update({
                    where: {
                        id: routeId
                    },
                    data: {
                        isRouteActual: false
                    }
                })

                return createdStop;
            }
        )

        return this.mapRouteStopResponse(stop);
    }

    async update(
        routeId: number,
        stopId: number,
        currentUserId: number,
        dto: UpdateRouteStopDto
    ): Promise<RouteStopResponseDto> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true
            }
        })

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException(
                'You cannot modify this route',
            );
        }

        const stop = await this.prismaService.routeStop.findFirst({
            where: {
                id: stopId,
                routeId,
            },
        });

        if (!stop) {
            throw new NotFoundException('Route stop not found');
        }

        const coordinatesChanged =
            (dto.latitude !== undefined &&
                dto.latitude !== Number(stop.latitude)) ||
            (dto.longitude !== undefined &&
                dto.longitude !== Number(stop.longitude));

        const updatedStop = await this.prismaService.$transaction(async tx => {
            const result = await tx.routeStop.update({
                where: {
                    id: stopId
                },
                data: {
                    name: dto.name,
                    address: dto.address,
                    cityName: dto.cityName,
                    countryName: dto.countryName,
                    countryCode: dto.countryCode,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    description: dto.description,
                }
            })

            if (coordinatesChanged) {
                await tx.route.update({
                    where: {
                        id: routeId
                    },
                    data: {
                        isRouteActual: false
                    }
                })
            }

            return result;
        })

        return this.mapRouteStopResponse(updatedStop)
    }

    async remove(
        routeId: number,
        stopId: number,
        currentUserId: number,
    ): Promise<void> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true
            }
        })

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException(
                'You cannot modify this route',
            );
        }

        const stop = await this.prismaService.routeStop.findFirst({
            where: {
                id: stopId,
                routeId,
            }
        })

        if (!stop) {
            throw new NotFoundException('Route stop not found');
        }

        await this.prismaService.$transaction(async tx => {
            await tx.routeStop.delete({
                where: {
                    id: stopId,
                }
            })

            await tx.routeStop.updateMany({
                where: {
                    routeId,
                    position: {
                        gt: stop.position
                    }
                },
                data: {
                    position: {
                        decrement: 1
                    }
                }
            })

            await tx.route.update({
                where: {
                    id: routeId
                },
                data: {
                    isRouteActual: false
                }
            })
        })
    }

    async reorder(
        routeId: number,
        currentUserId: number,
        dto: ReorderRouteStopsDto
    ): Promise<RouteStopResponseDto[]> {
        const route = await this.prismaService.route.findUnique({
            where: {
                id: routeId,
            },
            select: {
                id: true,
                userId: true
            }
        })

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException(
                'You cannot modify this route',
            );
        }

        const existingStops =
            await this.prismaService.routeStop.findMany({
                where: {
                    routeId,
                },
                orderBy: {
                    position: 'asc',
                },
            });

        if (dto.stops.length !== existingStops.length) {
            throw new BadRequestException(
                'All route stops must be provided',
            );
        }

        const existingIds = new Set(
            existingStops.map(stop => stop.id),
        );

        const requestedIds = dto.stops.map(
            item => item.id,
        );

        const uniqueRequestedIds = new Set(requestedIds);

        if (uniqueRequestedIds.size !== requestedIds.length) {
            throw new BadRequestException(
                'Route stop ids must be unique',
            );
        }

        for (const item of dto.stops) {
            if (!existingIds.has(item.id)) {
                throw new NotFoundException(
                    `Route stop ${item.id} not found`,
                );
            }
        }

        const positions = dto.stops.map(
            item => item.position,
        );

        const uniquePositions = new Set(positions);

        if (uniquePositions.size !== positions.length) {
            throw new BadRequestException(
                'Positions must be unique',
            );
        }
        const sortedPositions = [...positions,]
            .sort((a, b) => a - b);

        const positionsAreSequential =
            sortedPositions.every((position, index) =>
                    position === index + 1,
            );

        if (!positionsAreSequential) {
            throw new BadRequestException(
                'Positions must start from 1 and be sequential',
            );
        }

        await this.prismaService.$transaction(
            async (tx) => {
                const temporaryOffset = 1000;

                for (const item of dto.stops) {
                    await tx.routeStop.update({
                        where: {
                            id: item.id,
                        },
                        data: {
                            position:
                                item.position + temporaryOffset,
                        },
                    });
                }

                for (const item of dto.stops) {
                    await tx.routeStop.update({
                        where: {
                            id: item.id,
                        },
                        data: {
                            position:
                            item.position,
                        },
                    });
                }

                await tx.route.update({
                    where: {
                        id: routeId,
                    },
                    data: {
                        isRouteActual: false,
                    },
                });
            },
        );

        const reorderedStops =
            await this.prismaService.routeStop.findMany({
                where: {
                    routeId,
                },
                orderBy: {
                    position: 'asc',
                },
            });

        return reorderedStops.map(
            stop =>
                this.mapRouteStopResponse(stop),
        );

    }

    private mapRouteStopResponse(
        stop: RouteStop,
    ): RouteStopResponseDto {
        return {
            id: stop.id,
            routeId: stop.routeId,
            name: stop.name,
            address: stop.address,
            cityName: stop.cityName,
            countryName: stop.countryName,
            countryCode: stop.countryCode,
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
            position: stop.position,
            description: stop.description,
            createdAt: stop.createdAt,
            updatedAt: stop.updatedAt,
        };
    }
}
