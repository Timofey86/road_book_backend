import {Injectable, NotFoundException} from '@nestjs/common';
import {LikesRepository} from "./repositories/likes.repository";
import {LikeResponseDto} from "./response/like-response.dto";

@Injectable()
export class LikesService {
    constructor(private readonly likesRepository: LikesRepository) {}

    async like(
        routeId: number,
        currentUserId: number,
    ): Promise<LikeResponseDto> {
        const route = await this.likesRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const existingLike = await this.likesRepository.find(
            currentUserId,
            routeId,
        );

        if (!existingLike) {
            await this.likesRepository.create(
                currentUserId,
                routeId,
            );
        }

        const likesCount =
            await this.likesRepository.countByRoute(routeId);

        return {
            routeId,
            isLiked: true,
            likesCount,
        };
    }

    async unlike(
        routeId: number,
        currentUserId: number,
    ): Promise<LikeResponseDto> {
        const route = await this.likesRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const existingLike = await this.likesRepository.find(
            currentUserId,
            routeId,
        );

        if (existingLike) {
            await this.likesRepository.delete(
                currentUserId,
                routeId,
            );
        }

        const likesCount =
            await this.likesRepository.countByRoute(routeId);

        return {
            routeId,
            isLiked: false,
            likesCount,
        };
    }
}
