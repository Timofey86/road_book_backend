import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {UserResponseDto} from "./response/user-response.dto";
import {UpdateUserDto} from "./dto/update-user.dto";
import {PreferredLanguage, Prisma} from "../../generated/prisma/client";
import {StorageService} from "../storage/storage.service";
import {randomUUID} from "node:crypto";

@Injectable()
export class UsersService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly storageService: StorageService,
    ) {
    }

    async toResponseDto(
        user: {
            id: number;
            name: string;
            email: string;
            bio: string | null;
            avatarObjectKey: string | null;
            preferredLanguage: PreferredLanguage;
            createdAt: Date;
            updatedAt: Date;
        },
    ): Promise<UserResponseDto> {
        const avatarUrl = user.avatarObjectKey
            ? await this.storageService.getSignedUrl(user.avatarObjectKey)
            : null;

        return {
            ...user,
            avatarUrl,
        };
    }

    findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: {email},
        });
    }

    create(data: {
        name: string;
        email: string;
        passwordHash: string;
        bio?: string;
    }) {
        return this.prismaService.user.create({
            data,
            omit: {
                passwordHash: true,
            },
        });
    }

    async findById(id: number): Promise<UserResponseDto | null> {
        const user = await this.prismaService.user.findUnique({
            where: {id},
            omit: {
                passwordHash: true,
            },
        });

        if (!user) {
            return null;
        }

        return this.toResponseDto(user);
    }

    async update(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
        try {
            const user = await this.prismaService.user.update({
                where: {id},
                data: dto,
                omit: {
                    passwordHash: true,
                },
            });

            return this.toResponseDto(user);

        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('User with this email already exists');
            }

            throw error;
        }
    }

    async uploadAvatar(
        userId: number,
        file: Express.Multer.File,
    ) {
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

        const objectionKey = `avatars/${userId}/${randomUUID()}${extension}`;

        const user = await this.prismaService.user.findUnique({
            where: {id: userId},
            select: {
                avatarObjectKey: true
            }
        })

        if (!user) {
            throw new NotFoundException(' User not found');
        }

        await this.storageService.upload(
            objectionKey,
            file.buffer,
            file.mimetype
        );

        try {
            const updatedUser = await this.prismaService.user.update({
                where: {id: userId},
                data: {
                    avatarObjectKey: objectionKey
                },
                omit: {
                    passwordHash: true,
                }
            })

            if (user.avatarObjectKey) {
                await this.storageService.delete(user.avatarObjectKey);
            }
            return this.toResponseDto(updatedUser);
        } catch (error) {
            await this.storageService.delete(objectionKey);

            throw error;
        }
    }

    async deleteAvatar(userId: number): Promise<UserResponseDto> {
        const user = await this.prismaService.user.findUnique({
            where: {id: userId},
            omit: {
                passwordHash: true,
            }
        })

        if (!user) {
            throw new NotFoundException('user not found')
        }

        if (user.avatarObjectKey) {
            await this.storageService.delete(user.avatarObjectKey)
        }

        const updatedUser = await this.prismaService.user.update({
            where: {id: userId},
            data: {
                avatarObjectKey: null
            },
            omit: {
                passwordHash: true,
            }
        })

        return this.toResponseDto(updatedUser)
    }

    async deleteUser(userId: number) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                avatarObjectKey: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found')
        }

        await this.prismaService.user.delete({where: {id: userId}})

        if (user.avatarObjectKey) {
            await this.storageService.delete(user.avatarObjectKey)
        }
    }
}
