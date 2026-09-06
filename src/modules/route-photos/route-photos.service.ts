import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {RoutePhotosRepository} from "./repositories/route-photos.repositories";
import {StorageService} from "../storage/storage.service";
import {RoutePhotoResponseDto} from "./response/route-photos-response.dto";
import {randomUUID} from "node:crypto";
import {getImageExtension} from '../../common/utils/image.utils';
import {RoutePhoto} from "../../generated/prisma/client";
import {UpdateRoutePhotoDto} from "./dto/update-route-photo.dto";
import {RoutePhotosMapper} from "./mappers/route-photos.mapper";
import {ReorderRoutePhotosDto} from "./dto/reorder-route-photo.dto";

@Injectable()
export class RoutePhotosService {
    private readonly maxPhotosPerRoute = 20;

    constructor(
        private readonly routePhotosRepository: RoutePhotosRepository,
        private readonly storageService: StorageService,
        private readonly routePhotosMapper: RoutePhotosMapper,
    ) {
    }

    async upload(
        routeId: number,
        currentUserId: number,
        file: Express.Multer.File,
        caption?: string,
    ): Promise<RoutePhotoResponseDto> {

        if (!file) {
            throw new BadRequestException({
                code: 'ROUTE_PHOTO_REQUIRED'
            });
        }

        const route = await this.routePhotosRepository
            .findRouteForOwnership(routeId);

        if (!route) {
            throw new NotFoundException({
                code: 'ROUTE_NOT_FOUND'
            });
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException({
                code: 'ROUTE_PHOTO_ADD_FORBIDDEN'
            });
        }

        const photosCount = await this.routePhotosRepository.countByRoute(routeId);

        if (photosCount >= this.maxPhotosPerRoute) {
            throw new BadRequestException({
                code: 'ROUTE_PHOTO_LIMIT_EXCEEDED',
                args: {
                    maxPhotos: this.maxPhotosPerRoute,
                },
            });
        }

        const lastPhoto = await this.routePhotosRepository.findLastPosition(routeId);
        const position = lastPhoto ? lastPhoto.position + 1 : 1;
        const extension = getImageExtension(file.mimetype);
        const objectKey = `routes/${routeId}/photos/${randomUUID()}.${extension}`;

        await this.storageService.upload(
            objectKey,
            file.buffer,
            file.mimetype,
        );

        let photo: RoutePhoto;

        try {
            photo = await this.routePhotosRepository.create(
                routeId,
                objectKey,
                caption?.trim() || null,
                position,
            );
        } catch (error) {
            await this.storageService.safeDelete(objectKey);
            throw error;
        }

        return this.routePhotosMapper.map(photo);
    }

    async remove(
        routeId: number,
        photoId: number,
        currentUserId: number,
    ): Promise<void> {

        const route = await this.routePhotosRepository.findRouteForOwnership(routeId);

        if (!route) {
            throw new NotFoundException({
                code: 'ROUTE_NOT_FOUND',
            });
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException({
                code: 'ROUTE_PHOTO_DELETE_FORBIDDEN'
            });
        }

        const photo = await this.routePhotosRepository.findById(routeId, photoId);

        if (!photo) {
            throw new NotFoundException({
                code: 'ROUTE_PHOTO_NOT_FOUND'
            });
        }

        await this.routePhotosRepository.deleteAndShiftPositions(
            photo.id,
            routeId,
            photo.position,
        );

        await this.storageService.safeDelete(
            photo.objectKey,
        );
    }

    async update(
        routeId: number,
        photoId: number,
        currentUserId: number,
        dto: UpdateRoutePhotoDto,
    ): Promise<RoutePhotoResponseDto> {
        const route =
            await this.routePhotosRepository.findRouteForOwnership(routeId);

        if (!route) {
            throw new NotFoundException({
                code: 'ROUTE_NOT_FOUND'
            });
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException({
                code: 'ROUTE_PHOTO_UPDATE_FORBIDDEN'
            });
        }

        const photo =
            await this.routePhotosRepository.findById(
                routeId,
                photoId,
            );

        if (!photo) {
            throw new NotFoundException({
                code: 'ROUTE_PHOTO_NOT_FOUND'
            });
        }

        const caption = dto.caption === null
            ? null
            : dto.caption?.trim() || null;

        const updatedPhoto =
            await this.routePhotosRepository.updateCaption(
                photo.id,
                caption,
            );

        return this.routePhotosMapper.map(updatedPhoto);
    }

    async reorder(
        routeId: number,
        currentUserId: number,
        dto: ReorderRoutePhotosDto,
    ): Promise<RoutePhotoResponseDto[]> {
        const route = await this.routePhotosRepository
            .findRouteForOwnership(routeId);

        if (!route) {
            throw new NotFoundException({
                code: 'ROUTE_NOT_FOUND'
            });
        }

        if (route.userId !== currentUserId) {
            throw new ForbiddenException({
                code: 'ROUTE_PHOTO_REORDER_FORBIDDEN'
            });
        }

        const photos = await this.routePhotosRepository
            .findAllByRoute(routeId);

        if (photos.length !== dto.photoIds.length) {
            throw new BadRequestException({
                code: 'ROUTE_PHOTO_ALL_IDS_REQUIRED'
            });
        }

        const existingIds = new Set(photos.map((photo) => photo.id));
        const hasUnknownPhoto = dto.photoIds.some(
                (photoId) => !existingIds.has(photoId),
            );

        if (hasUnknownPhoto) {
            throw new BadRequestException({
                code: 'ROUTE_PHOTO_INVALID'
            });
        }

        const uniqueIds = new Set(dto.photoIds);

        if (uniqueIds.size !== dto.photoIds.length) {
            throw new BadRequestException({
                code: 'ROUTE_PHOTO_UNIQUE'
            });
        }

        await this.routePhotosRepository.reorder(
            routeId,
            dto.photoIds,
        );

        const reorderedPhotos = await this.routePhotosRepository
                .findAllByRoute(routeId);

        return this.routePhotosMapper.mapMany(reorderedPhotos);
    }
}
