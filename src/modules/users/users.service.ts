import {BadRequestException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {UpdateUserDto} from "./dto/update-user.dto";
import {StorageService} from "../storage/storage.service";
import {randomUUID} from "node:crypto";
import {UserMapper} from "./mappers/user.mapper";
import {UsersRepository} from "./repositories/user.repository";
import {CurrentUserResponseDto} from "./response/current-user-response.dto";
import {PublicUserResponseDto} from "./response/public-user-response.dto";

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly storageService: StorageService,
        private readonly userMapper: UserMapper,
    ) {
    }

    findByEmail(email: string) {
        return this.usersRepository.findByEmail(email);
    }

    // async toResponseDto(
    //     user: {
    //         id: number;
    //         name: string;
    //         email: string;
    //         bio: string | null;
    //         avatarObjectKey: string | null;
    //         preferredLanguage: PreferredLanguage;
    //         createdAt: Date;
    //         updatedAt: Date;
    //     },
    // ): Promise<UserResponseDto> {
    //     const avatarUrl = user.avatarObjectKey
    //         ? await this.storageService.getSignedUrl(user.avatarObjectKey)
    //         : null;
    //
    //     return {
    //         ...user,
    //         avatarUrl,
    //     };
    // }

    create(data: {
        name: string;
        email: string;
        passwordHash: string;
        bio?: string;
    }) {
        return this.usersRepository.create(data);
    }

    async findMe(userId: number): Promise<CurrentUserResponseDto> {
        const [user, receivedLikesCount] = await Promise.all([
            this.usersRepository.findByIdWithStats(userId),
            this.usersRepository.countReceivedLikes(userId),
        ]);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.userMapper.mapCurrentUser(
            user,
            receivedLikesCount,
        );
    }

    async findPublicProfile(
        userId: number,
    ): Promise<PublicUserResponseDto> {
        const [user, receivedLikesCount] = await Promise.all([
            this.usersRepository.findByIdWithStats(userId),
            this.usersRepository.countReceivedLikes(userId),
        ]);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.userMapper.mapPublicUser(
            user,
            receivedLikesCount,
        );
    }

    async update(
        userId: number,
        dto: UpdateUserDto,
    ): Promise<CurrentUserResponseDto> {
        await this.ensureUserExists(userId);

        await this.usersRepository.update(userId, dto);

        return this.findMe(userId);
    }

    async uploadAvatar(
        userId: number,
        file: Express.Multer.File,
    ): Promise<CurrentUserResponseDto> {
        if (!file) {
            throw new BadRequestException('Avatar file is required');
        }

        const extensionMap: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        };

        const extension = extensionMap[file.mimetype];

        if (!extension) {
            throw new BadRequestException('Unsupported image type');
        }

        const user = await this.usersRepository.findAvatar(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const oldObjectKey = user.avatarObjectKey;
        const newObjectKey =
            `avatars/${userId}/${randomUUID()}${extension}`;

        await this.storageService.upload(
            newObjectKey,
            file.buffer,
            file.mimetype,
        );

        try {
            await this.usersRepository.updateAvatar(
                userId,
                newObjectKey,
            );
        } catch (error) {
            await this.safeDeleteObject(newObjectKey);
            throw error;
        }

        if (oldObjectKey) {
            await this.safeDeleteObject(oldObjectKey);
        }

        return this.findMe(userId);
    }

    async deleteAvatar(
        userId: number,
    ): Promise<CurrentUserResponseDto> {
        const user = await this.usersRepository.findAvatar(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const oldObjectKey = user.avatarObjectKey;

        await this.usersRepository.updateAvatar(userId, null);

        if (oldObjectKey) {
            await this.safeDeleteObject(oldObjectKey);
        }

        return this.findMe(userId);
    }

    async deleteUser(userId: number): Promise<void> {
        const user = await this.usersRepository.findForDelete(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const objectKeys: string[] = [];

        if (user.avatarObjectKey) {
            objectKeys.push(user.avatarObjectKey);
        }

        for (const route of user.routes) {
            if (route.coverObjectKey) {
                objectKeys.push(route.coverObjectKey);
            }

            for (const photo of route.photos) {
                objectKeys.push(photo.objectKey);
            }
        }

        await this.usersRepository.delete(userId);

        await Promise.allSettled(
            objectKeys.map((objectKey) =>
                this.safeDeleteObject(objectKey),
            ),
        );
    }

    private async ensureUserExists(userId: number): Promise<void> {
        const user = await this.usersRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }
    }

    private async safeDeleteObject(
        objectKey: string,
    ): Promise<void> {
        try {
            await this.storageService.delete(objectKey);
        } catch (error) {
            this.logger.warn(
                `Failed to delete storage object: ${objectKey}`,
                error,
            );
        }
    }
}
