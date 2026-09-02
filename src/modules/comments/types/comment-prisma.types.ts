import { Prisma } from '../../../generated/prisma/client';

export type CommentEntity = Prisma.CommentGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                avatarObjectKey: true;
            };
        };
    };
}>;