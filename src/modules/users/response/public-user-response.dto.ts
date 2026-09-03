import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class PublicUserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiPropertyOptional({
        example: 'Travel enthusiast',
        nullable: true,
    })
    bio: string | null;

    @ApiPropertyOptional({
        example: 'http://localhost:9000/road-book-local/avatars/5/....png?X-Amz-...',
        nullable: true,
    })
    avatarUrl: string | null;

    @ApiProperty({ example: 12 })
    routesCount: number;

    @ApiProperty({ example: 47 })
    receivedLikesCount: number;

    @ApiProperty({ example: '2026-08-16T12:00:00.000Z' })
    createdAt: Date;
}