import { ApiProperty } from '@nestjs/swagger';

export class CommentAuthorResponseDto {
    @ApiProperty({
        example: 5,
    })
    id: number;

    @ApiProperty({
        example: 'Timofey',
    })
    name: string;

    @ApiProperty({
        example: 'http://localhost:9000/road-book-local/avatars/5/avatar.png',
        nullable: true,
    })
    avatarUrl: string | null;
}

export class CommentResponseDto {
    @ApiProperty({
        example: 12,
    })
    id: number;

    @ApiProperty({
        example: 5,
    })
    routeId: number;

    @ApiProperty({
        example: 'Great route! I would love to visit these places.',
    })
    body: string;

    @ApiProperty({
        type: CommentAuthorResponseDto,
    })
    author: CommentAuthorResponseDto;

    @ApiProperty({
        example: '2026-09-02T08:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-09-02T08:00:00.000Z',
    })
    updatedAt: Date;
}