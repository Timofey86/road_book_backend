import {Injectable, NotFoundException} from '@nestjs/common';
import {FavoritesRepository} from "./repositories/favorites.repository";
import {RouteMapper} from "../routes/mappers/route.mapper";
import {FavoriteResponseDto} from "./response/favorite-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";
import {FavoritesPaginatedResponseDto} from "./response/favorites-paginated-response.dto";

@Injectable()
export class FavoritesService {
    constructor(
        private readonly favoritesRepository: FavoritesRepository,
        private readonly routeMapper: RouteMapper,
    ) {
    }

    async add(
        routeId: number,
        currentUserId: number,
    ): Promise<FavoriteResponseDto> {
        const route = await this.favoritesRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const existingFavorite = await this.favoritesRepository.find(
            currentUserId,
            routeId,
        );

        if (!existingFavorite) {
            await this.favoritesRepository.create(
                currentUserId,
                routeId,
            );
        }

        return {
            routeId,
            isFavorite: true,
        };
    }

    async remove(routeId: number, currentUserId: number): Promise<FavoriteResponseDto> {
        const route = await this.favoritesRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const existingFavorite = await this.favoritesRepository.find(
            currentUserId,
            routeId,
        );

        if (existingFavorite) {
            await this.favoritesRepository.delete(
                currentUserId,
                routeId,
            );
        }

        return {
            routeId,
            isFavorite: false,
        };
    }

    async findAll(
        currentUserId: number,
        query: PaginationQueryDto
    ): Promise<FavoritesPaginatedResponseDto> {

        const skip = (query.page - 1) * query.limit;

        const [favorites, totalItems] = await Promise.all([
            this.favoritesRepository.findAllByUser(
                currentUserId,
                skip,
                query.limit,
            ),
            this.favoritesRepository.countByUser(
                currentUserId,
            ),
        ]);

        return {
            items: await Promise.all(
                favorites.map((favorite) =>
                    this.routeMapper.mapRouteListItemResponse(
                        favorite.route,
                    ),
                ),
            ),
            meta: {
                page: query.page,
                limit: query.limit,
                totalItems,
                totalPages: Math.ceil(
                    totalItems / query.limit,
                ),
            },
        };
    }
}
