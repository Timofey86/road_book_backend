import { ApiProperty } from '@nestjs/swagger';

export class RouteCoverResponseDto {
    @ApiProperty({
        example: 'http://localhost:9000/road-book-local/routes/5/cover/abc.jpg',
    })
    coverUrl: string;
}