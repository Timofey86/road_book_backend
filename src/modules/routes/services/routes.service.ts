import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import {CreateRouteDto} from '../dto/create-route.dto';
import {UpdateRouteDto} from '../dto/update-route.dto';
import {RouteResponseDto} from '../response/route-response.dto';
import {RouteDetailsResponseDto} from '../response/route-details-response.dto';
import {RouteBuildResponseDto} from '../response/route-build-response.dto';
import {RoutesRepository} from '../repositories/routes.repository';
import {RouteMapper} from '../mappers/route.mapper';
import {StorageService} from '../../storage/storage.service';
import {RoutingService} from '../../routing/routing.service';
import {TagsService} from '../../tags/tags.service';
import {UpdateRouteTagsDto} from "../dto/update-route-tags.dto";
import {randomUUID} from "node:crypto";
import {RouteCoverResponseDto} from "../response/route-cover-response.dto";
import { getImageExtension } from '../../../common/utils/image.utils';

@Injectable()
export class RoutesService {
    private readonly logger = new Logger(RoutesService.name);

    constructor(
        private readonly routesRepository: RoutesRepository,
        private readonly routeMapper: RouteMapper,
        private readonly storageService: StorageService,
        private readonly routingService: RoutingService,
        private readonly tagsService: TagsService,
    ) {
    }

    async create(
        userId: number,
        dto: CreateRouteDto,
    ): Promise<RouteResponseDto> {
        const title =
            dto.title.trim();

        const slug =
            await this.generateUniqueSlug(
                userId,
                title,
            );

        const tags =
            this.tagsService.normalizeTags(
                dto.tags ?? [],
            );

        const route =
            await this.routesRepository.create(
                userId,
                title,
                slug,
                dto.description?.trim() || null,
                tags,
            );

        return this.routeMapper.mapRouteResponse(route);
    }

    async findOne(
        routeId: number,
        currentUserId?: number,
    ): Promise<RouteDetailsResponseDto> {
        const route =
            await this.routesRepository
                .findDetails(
                    routeId,
                    currentUserId,
                );

        if (!route) {
            throw new NotFoundException(
                'Route not found',
            );
        }

        return this.routeMapper
            .mapRouteDetailsResponse(route);
    }

    async update(routeId: number, currentUserId: number, dto: UpdateRouteDto): Promise<RouteResponseDto> {
        const route = await this.routesRepository.findForOwnership(routeId);

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

        const updatedRoute = await this.routesRepository.update(
            routeId,
            {
                title,
                slug,
                description:
                    dto.description !== undefined ?
                        dto.description.trim() || null
                        : undefined,
            },
        );

        return this.routeMapper.mapRouteResponse(updatedRoute);
    }

    async remove(routeId: number, currentUserId: number): Promise<void> {
        const route = await this.routesRepository.findForDelete(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException('You cannot delete this route');
        }

        const objectKeys = [
            route.coverObjectKey,
            ...route.photos.map((photo) => photo.objectKey),
        ].filter((key): key is string => key !== null);

        await this.routesRepository.delete(routeId)

        const results = await Promise.allSettled(
            objectKeys.map(
                (objectKey) =>
                    this.storageService.delete(objectKey)
            ),
        );

        results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    this.logger.warn(
                        `Failed to delete object "${objectKeys[index]}"`,
                        result.reason instanceof Error
                            ? result.reason.stack
                            : String(result.reason),
                    );
                }
            },
        );
    }

    async buildRoute(
        routeId: number,
        userId: number,
    ): Promise<RouteBuildResponseDto> {
        const route = await this.routesRepository.findForBuild(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== userId) {
            throw new ForbiddenException(
                'You are not allowed to build this route',
            );
        }

        if (route.stops.length < 2) {
            throw new BadRequestException(
                'Route must contain at least 2 stops',
            );
        }

        const coordinates: [number, number][] =
            route.stops.map((stop) => [
                Number(stop.longitude),
                Number(stop.latitude),
            ]);

        const routingResult = await this.routingService.buildRoute(coordinates);

        const distanceMeters = Math.round(routingResult.distanceMeters);
        const durationSeconds = Math.round(routingResult.durationSeconds);
        const builtAt = new Date();
        await this.routesRepository.updateBuildResult(
            routeId,
            {
                totalDistanceMeters: distanceMeters,
                totalDurationSeconds: durationSeconds,
                routeGeometry: routingResult.geometry,
                routeBuiltAt: builtAt,
                isRouteActual: true,
            },
        );

        return {
            id: routeId,
            totalDistanceMeters: distanceMeters,
            totalDurationSeconds: durationSeconds,
            routeGeometry: routingResult.geometry,
            routeBuiltAt: builtAt,
            isRouteActual: true,
        };
    }

    private async generateUniqueSlug(
        userId: number,
        title: string,
        excludeRouteId?: number,
    ): Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (
            await this.routesRepository.existsByUserAndSlug(userId, slug, excludeRouteId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    async updateTags(
        routeId: number,
        currentUserId: number,
        dto: UpdateRouteTagsDto,
    ): Promise<RouteResponseDto> {
        const route = await this.routesRepository.findForOwnership(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException('You cannot edit this route');
        }

        const tags = this.tagsService.normalizeTags(dto.tags);

        const updatedRoute = await this.routesRepository
            .replaceTags(routeId, tags);

        return this.routeMapper.mapRouteResponse(updatedRoute);
    }

    async uploadCover(
        routeId: number,
        currentUserId: number,
        file: Express.Multer.File,
    ): Promise<RouteCoverResponseDto> {
        if (!file) {
            throw new BadRequestException('Cover image is required');
        }

        const route = await this.routesRepository.findForCover(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException('You cannot edit this route');
        }

        const oldObjectKey = route.coverObjectKey;
        const extension = getImageExtension(file.mimetype);
        const objectKey = `routes/${routeId}/cover/${randomUUID()}.${extension}`;

        await this.storageService.upload(
            objectKey,
            file.buffer,
            file.mimetype,
        );

        try {
            await this.routesRepository.updateCover(routeId, objectKey);
        } catch (error) {
            await this.storageService.safeDelete(objectKey);
            throw error;
        }

        if (oldObjectKey) {
            await this.storageService.safeDelete(oldObjectKey);
        }

        const coverUrl = await this.storageService.getSignedUrl(objectKey);

        return {
            coverUrl,
        };
    }
}