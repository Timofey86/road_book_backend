import {Controller, Get, Query} from '@nestjs/common';
import {ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags} from "@nestjs/swagger";
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
        description:
            'Returns all tags or filters them by name using the optional search query parameter.',
    })
    @ApiOkResponse({
        description: 'Tags retrieved successfully',
        type: [TagResponseDto],
    })
    @ApiBadRequestResponse({
        description: 'Invalid search query',
    })

    findAll(
        @Query() query: TagsQueryDto,
    ): Promise<TagResponseDto[]> {
        return this.tagsService.findAll(
            query.search,
        );
    }
}
