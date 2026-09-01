import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TagsRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAll(search?: string) {
        return this.prisma.tag.findMany({
            where: search
                ? {
                    name: {
                        contains: search,
                    },
                }
                : undefined,
            orderBy: {
                name: 'asc',
            },
            take: 20,
        });
    }
}