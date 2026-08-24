import { Injectable } from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {CreateRouteDto} from "./dto/create-route.dto";
import slugify from "slugify";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";

@Injectable()
export class RoutesService {
    constructor(private readonly prismaService: PrismaService) {}

    async create(userId: number, dto: CreateRouteDto):Promise<RouteCreatedResponseDto> {
        const title = dto.title.trim();
        const slug = await this.generateUniqueSlug(userId, title);
        return this.prismaService.route.create({
            data: {
                userId,
                title,
                slug,
                description: dto.description?.trim(),
            },
        });
    }

    private async generateUniqueSlug(userId: number, title: string):Promise<string> {
        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
        });

        let slug = baseSlug;
        let counter = 2;

        while (
            await this.prismaService.route.findUnique({
                where: {
                    userId_slug: {
                        userId,
                        slug,
                    },
                },
            })
            ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }
}
