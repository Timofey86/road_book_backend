import {Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma/prisma.service";
import {Prisma} from "../../../generated/prisma/client";

@Injectable()
export class UsersRepository {
    constructor(private readonly prismaService: PrismaService) {}

    findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: { email },
        });
    }

    create(data: Prisma.UserCreateInput) {
        return this.prismaService.user.create({
            data,
            omit: {
                passwordHash: true,
            },
        });
    }

    findById(id: number) {
        return this.prismaService.user.findUnique({
            where: { id },
            omit: {
                passwordHash: true,
            },
        });
    }

    findByIdWithStats(id: number) {
        return this.prismaService.user.findUnique({
            where: { id },
            omit: {
                passwordHash: true,
            },
            include: {
                _count: {
                    select: {
                        routes: true,
                    },
                },
            },
        });
    }

    countReceivedLikes(userId: number): Promise<number> {
        return this.prismaService.like.count({
            where: {
                route: {
                    userId,
                },
            },
        });
    }

    update(
        id: number,
        data: Prisma.UserUpdateInput,
    ) {
        return this.prismaService.user.update({
            where: { id },
            data,
            omit: {
                passwordHash: true,
            },
        });
    }

    findAvatar(id: number) {
        return this.prismaService.user.findUnique({
            where: { id },
            select: {
                id: true,
                avatarObjectKey: true,
            },
        });
    }

    updateAvatar(
        id: number,
        avatarObjectKey: string | null,
    ) {
        return this.prismaService.user.update({
            where: { id },
            data: {
                avatarObjectKey,
            },
            omit: {
                passwordHash: true,
            },
        });
    }


    findForDelete(id: number) {
        return this.prismaService.user.findUnique({
            where: { id },
            select: {
                id: true,
                avatarObjectKey: true,
                routes: {
                    select: {
                        coverObjectKey: true,
                        photos: {
                            select: {
                                objectKey: true,
                            },
                        },
                    },
                },
            },
        });
    }

    delete(id: number) {
        return this.prismaService.user.delete({
            where: { id },
        });
    }
}