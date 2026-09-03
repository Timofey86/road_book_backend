import {Injectable} from '@nestjs/common';
import {Prisma} from '../../../generated/prisma/client';
import {RouteSortBy, RoutesQueryDto} from '../dto/routes-query.dto';
import {RoutesPaginatedResponseDto} from '../response/routes-paginated-response.dto';
import {RoutesRepository} from '../repositories/routes.repository';
import {RouteMapper} from '../mappers/route.mapper';

@Injectable()
export class RoutesQueryService {
    constructor(
        private readonly routesRepository: RoutesRepository,
        private readonly routeMapper: RouteMapper,
    ) {
    }

    async getRoutesByUser(
        currentUserId: number,
        page: number,
        limit: number,
    ): Promise<RoutesPaginatedResponseDto> {
        const skip =
            (page - 1) * limit;

        const [
            routes,
            totalItems,
        ] = await Promise.all([
            this.routesRepository.findByUser(
                currentUserId,
                skip,
                limit,
            ),

            this.routesRepository.countByUser(currentUserId),
        ]);

        const items =
            await Promise.all(
                routes.map((route) =>
                    this.routeMapper.mapRouteListItemResponse(route))
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

    async findAll(
        query: RoutesQueryDto,
    ): Promise<RoutesPaginatedResponseDto> {
        const {
            page,
            limit,
            search,
            sortBy,
            sortOrder,
            minDistance,
            maxDistance,
            userId
        } = query;

        const skip = (page - 1) * limit;
        const normalizedSearch = search?.trim();
        const where: Prisma.RouteWhereInput = {
            ...(userId !== undefined && {
                userId,
            }),

            ...(normalizedSearch && {
                OR: [
                    {
                        title: {
                            contains: normalizedSearch,
                        },
                    },

                    {
                        user: {
                            name: {
                                contains: normalizedSearch,
                            },
                        },
                    },
                ],
            }),

            ...(
                minDistance !== undefined ||
                maxDistance !== undefined
                    ? {
                        totalDistanceMeters: {
                            ...(minDistance !== undefined && {gte: minDistance}),
                            ...(maxDistance !== undefined && {lte: maxDistance}),
                        },
                    }
                    : {}
            ),
        };

        let orderBy: Prisma.RouteOrderByWithRelationInput[];

        switch (sortBy) {
            case RouteSortBy.LIKES:
                orderBy = [
                    {
                        likes: {
                            _count: sortOrder,
                        },
                    },
                    {
                        createdAt: 'desc',
                    },
                ];
                break;

            case RouteSortBy.DISTANCE:
                orderBy = [
                    {
                        totalDistanceMeters: sortOrder,
                    },
                    {
                        createdAt: 'desc',
                    },
                ];
                break;

            case RouteSortBy.CREATED_AT:
            default:
                orderBy = [
                    {
                        createdAt: sortOrder,
                    },
                ];
                break;
        }

        const [
            routes,
            totalItems,
        ] = await Promise.all([
            this.routesRepository.findAll(
                where,
                orderBy,
                skip,
                limit,
            ),
            this.routesRepository.count(where),
        ]);

        const items =
            await Promise.all(
                routes.map((route) =>
                    this.routeMapper.mapRouteListItemResponse(route)
                ),
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
}