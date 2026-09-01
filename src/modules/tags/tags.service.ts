import { Injectable } from '@nestjs/common';
import slugify from 'slugify';
import {TagResponseDto} from "./response/tag-response.dto";
import {TagsRepository} from "./repositories/tags.repository";

@Injectable()
export class TagsService {

    constructor(private readonly tagsRepository: TagsRepository) {
    }
    normalizeTags(tags: string[]): {
        name: string;
        slug: string;
    }[] {
        const normalizedTags = tags
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => ({
                name,
                slug: slugify(name, {
                    lower: true,
                    strict: true,
                    trim: true,
                }),
            }));

        return [
            ...new Map(
                normalizedTags.map((tag) => [
                    tag.slug,
                    tag,
                ]),
            ).values(),
        ];
    }

    async findAll(
        search?: string,
    ): Promise<TagResponseDto[]> {
        const normalizedSearch =
            search?.trim() || undefined;

        const tags =
            await this.tagsRepository.findAll(
                normalizedSearch,
            );

        return tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
        }));
    }
}
