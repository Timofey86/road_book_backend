import {Injectable} from "@nestjs/common";
import {StorageService} from "../../storage/storage.service";
import {UserWithStatsEntity} from "../types/user-prisma.types";
import {CurrentUserResponseDto} from "../response/current-user-response.dto";
import {PublicUserResponseDto} from "../response/public-user-response.dto";


@Injectable()
export class UserMapper{
    constructor(private readonly storageService: StorageService) {}

    async mapCurrentUser(
        user: UserWithStatsEntity,
        receivedLikesCount: number,
    ): Promise<CurrentUserResponseDto> {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            avatarUrl: await this.getOptionalSignedUrl(user.avatarObjectKey),
            preferredLanguage: user.preferredLanguage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            routesCount: user._count.routes,
            receivedLikesCount,
        };
    }

    async mapPublicUser(
        user: UserWithStatsEntity,
        receivedLikesCount: number,
    ): Promise<PublicUserResponseDto> {
        return {
            id: user.id,
            name: user.name,
            bio: user.bio,
            avatarUrl: await this.getOptionalSignedUrl(user.avatarObjectKey),
            createdAt: user.createdAt,
            routesCount: user._count.routes,
            receivedLikesCount,
        };
    }

    private async getOptionalSignedUrl(
        objectKey: string | null,
    ): Promise<string | null> {
        return objectKey
            ? this.storageService.getSignedUrl(objectKey)
            : null;
    }
}