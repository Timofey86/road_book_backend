import {Injectable} from "@nestjs/common";
import {StorageService} from "../../storage/storage.service";
import {CommentEntity} from "../types/comment-prisma.types";
import {CommentResponseDto} from "../response/comment-response.dto";

@Injectable()
export class CommentsMapper {
    constructor(private readonly storageService: StorageService) {}

    async map(
        comment: CommentEntity,
    ): Promise<CommentResponseDto> {
        const avatarUrl = comment.user.avatarObjectKey
            ? await this.storageService.getSignedUrl(
                comment.user.avatarObjectKey,
            )
            : null;

        return {
            id: comment.id,
            routeId: comment.routeId,
            body: comment.body,
            author: {
                id: comment.user.id,
                name: comment.user.name,
                avatarUrl,
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }

    async mapMany(
        comments: CommentEntity[],
    ): Promise<CommentResponseDto[]> {
        return Promise.all(
            comments.map((comment) =>
                this.map(comment),
            ),
        );
    }
}