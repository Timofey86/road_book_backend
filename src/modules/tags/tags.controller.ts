import {Controller, Get, Query} from '@nestjs/common';
import {ApiOkResponse, ApiOperation, ApiTags} from "@nestjs/swagger";
import {TagsService} from "./tags.service";
import {TagResponseDto} from "./response/tag-response.dto";
import {TagsQueryDto} from "./dto/tags-query.dto";

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Get()
    @ApiOperation({
        summary: 'Get tags',
    })
    @ApiOkResponse({
        description: 'Tags retrieved successfully',
        type: [TagResponseDto],
    })
    findAll(
        @Query() query: TagsQueryDto,
    ): Promise<TagResponseDto[]> {
        return this.tagsService.findAll(
            query.search,
        );
    }
}
