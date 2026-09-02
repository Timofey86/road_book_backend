import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode, HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiCreatedResponse, ApiForbiddenResponse, ApiNoContentResponse,
    ApiNotFoundResponse, ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {CommentsService} from "./comments.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CommentResponseDto} from "./response/comment-response.dto";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {CreateCommentDto} from "./dto/create-comment.dto";
import {CommentsPaginatedResponseDto} from "./response/comments-paginated-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";
import {UpdateCommentDto} from "./dto/update-comment.dto";

@ApiTags('Comments')
@Controller()
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post('routes/:routeId/comments')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiOperation({
        summary: 'Create a comment for a route',
    })
    @ApiCreatedResponse({
        type: CommentResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    create(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
        @Body() dto: CreateCommentDto,
    ): Promise<CommentResponseDto> {
        return this.commentsService.create(
            routeId,
            user.id,
            dto,
        );
    }

    @Get('routes/:routeId/comments')
    @ApiOperation({
        summary: 'Get route comments',
    })
    @ApiOkResponse({
        type: CommentsPaginatedResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    findAllByRoute(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Query() query: PaginationQueryDto,
    ): Promise<CommentsPaginatedResponseDto> {
        return this.commentsService.findAllByRoute(
            routeId,
            query,
        );
    }

    @Patch('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiOperation({
        summary: 'Update a comment',
    })
    @ApiOkResponse({
        type: CommentResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'Comment belongs to another user',
    })
    @ApiNotFoundResponse({
        description: 'Comment not found',
    })
    update(
        @Param('commentId', ParseIntPipe) commentId: number,
        @CurrentUser() user: JwtUser,
        @Body() dto: UpdateCommentDto,
    ): Promise<CommentResponseDto> {
        return this.commentsService.update(
            commentId,
            user.id,
            dto,
        );
    }

    @Delete('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a comment',
    })
    @ApiNoContentResponse({
        description: 'Comment deleted',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'Comment belongs to another user',
    })
    @ApiNotFoundResponse({
        description: 'Comment not found',
    })
    async remove(
        @Param('commentId', ParseIntPipe) commentId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<void> {
        await this.commentsService.remove(
            commentId,
            user.id,
        );
    }

}
