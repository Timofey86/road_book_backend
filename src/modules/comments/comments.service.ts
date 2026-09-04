import {ForbiddenException, Injectable, NotFoundException} from '@nestjs/common';
import {CommentsRepository} from "./repositories/comments.repository";
import {CommentsMapper} from "./mappers/comment.mapper";
import {CreateCommentDto} from "./dto/create-comment.dto";
import {CommentResponseDto} from "./response/comment-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";
import {CommentsPaginatedResponseDto} from "./response/comments-paginated-response.dto";
import {UpdateCommentDto} from "./dto/update-comment.dto";

@Injectable()
export class CommentsService {
    constructor(
        private readonly commentsRepository: CommentsRepository,
        private readonly commentsMapper: CommentsMapper,
    ) {
    }

    async create(
        routeId: number,
        currentUserId: number,
        dto: CreateCommentDto,
    ): Promise<CommentResponseDto> {
        const route = await this.commentsRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const comment = await this.commentsRepository.create(
            routeId,
            currentUserId,
            dto.body,
        );

        return this.commentsMapper.map(comment);
    }

    async findAllByRoute(
        routeId: number,
        query: PaginationQueryDto,
    ): Promise<CommentsPaginatedResponseDto> {
        const route = await this.commentsRepository.findRoute(routeId);

        if (!route) {
            throw new NotFoundException('Route not found');
        }

        const skip = (query.page - 1) * query.limit;

        const [comments, totalItems] = await Promise.all([
            this.commentsRepository.findAllByRoute(
                routeId,
                skip,
                query.limit,
            ),
            this.commentsRepository.countByRoute(routeId),
        ]);

        return {
            items: await this.commentsMapper.mapMany(comments),
            meta: {
                page: query.page,
                limit: query.limit,
                totalItems,
                totalPages: Math.ceil(totalItems / query.limit),
            },
        };
    }

    async update(
        commentId: number,
        currentUserId: number,
        dto: UpdateCommentDto,
    ): Promise<CommentResponseDto> {
        const comment = await this.commentsRepository.findById(commentId);

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== currentUserId) {
            throw new ForbiddenException('You cannot update this comment');
        }

        const updatedComment = await this.commentsRepository.update(
            commentId,
            dto.body,
        );

        return this.commentsMapper.map(updatedComment);
    }

    async remove(
        commentId: number,
        currentUserId: number,
    ): Promise<void> {
        const comment = await this.commentsRepository.findById(commentId);

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.userId !== currentUserId) {
            throw new ForbiddenException('You cannot delete this comment');
        }

        await this.commentsRepository.delete(commentId);
    }

}
