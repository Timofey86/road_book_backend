import { Injectable } from '@nestjs/common';
import { RoutePhoto } from '../../../generated/prisma/client';
import { StorageService } from '../../storage/storage.service';
import { RoutePhotoResponseDto } from '../response/route-photos-response.dto';

@Injectable()
export class RoutePhotosMapper {
    constructor(
        private readonly storageService: StorageService,
    ) {}

    async map(
        photo: RoutePhoto,
    ): Promise<RoutePhotoResponseDto> {
        return {
            id: photo.id,
            routeId: photo.routeId,
            url: await this.storageService.getSignedUrl(
                photo.objectKey,
            ),
            caption: photo.caption,
            position: photo.position,
            createdAt: photo.createdAt,
            updatedAt: photo.updatedAt,
        };
    }

    async mapMany(
        photos: RoutePhoto[],
    ): Promise<RoutePhotoResponseDto[]> {
        return Promise.all(
            photos.map((photo) => this.map(photo)),
        );
    }
}