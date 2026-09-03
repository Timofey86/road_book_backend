import { Prisma } from '../../../generated/prisma/client';

export type UserEntity = Prisma.UserGetPayload<{
    omit: {
        passwordHash: true;
    };
}>;

export type UserWithStatsEntity = Prisma.UserGetPayload<{
    omit: {
        passwordHash: true;
    };
    include: {
        _count: {
            select: {
                routes: true;
            };
        };
    };
}>;

export type UserAvatarEntity = Prisma.UserGetPayload<{
    select: {
        id: true;
        avatarObjectKey: true;
    };
}>;

export type UserForDeleteEntity = Prisma.UserGetPayload<{
    select: {
        id: true;
        avatarObjectKey: true;
        routes: {
            select: {
                coverObjectKey: true;
                photos: {
                    select: {
                        objectKey: true;
                    };
                };
            };
        };
    };
}>;

