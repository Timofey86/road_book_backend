import {Prisma} from "../../../generated/prisma/client";

export type RouteMutationEntity =
    Prisma.RouteGetPayload<{
        include: {
            stops: {
                orderBy: {
                    position: 'asc';
                };
            };
            routeTags: {
                include: {
                    tag: true;
                };
            };
        };
    }>;

export type RouteDetailsEntity = Prisma.RouteGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                avatarObjectKey: true;
            };
        };
        stops: true;
        photos: true;
        routeTags: {
            include: {
                tag: true;
            };
        };
        likes: {
            select: {
                userId: true;
            };
        };
        favorites: {
            select: {
                userId: true;
            };
        };
        _count: {
            select: {
                likes: true;
                comments: true;
            };
        };
    };
}>;

export type RouteListEntity = Prisma.RouteGetPayload<{
    include: {
        user: {
            select: {
                id: true;
                name: true;
                avatarObjectKey: true;
            };
        };
        _count: {
            select: {
                stops: true;
                likes: true;
                comments: true;
            };
        };
    };
}>;
