import { PreferredLanguage } from '../../../generated/prisma/enums';
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class UserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'John Doe' })
    name: string;

    @ApiProperty({ example: 'johndoe@example.com' })
    email: string;

    @ApiPropertyOptional({ example: 'Travel enthusiast', nullable: true })
    bio: string | null;

    @ApiPropertyOptional({
        example: 'avatars/550e8400-e29b-41d4-a716-446655440000.jpg',
        nullable: true,
    })
    avatarObjectKey: string | null;

    @ApiPropertyOptional({
        example: "http://localhost:9000/road-book-local/avatars/5/....png?X-Amz-...",
        nullable: true,
    })
    avatarUrl: string | null;

    @ApiProperty({
        enum: PreferredLanguage,
        example: PreferredLanguage.en,
    })
    preferredLanguage: PreferredLanguage;

    @ApiProperty({ example: '2026-08-16T12:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-08-16T12:00:00.000Z' })
    updatedAt: Date;
}