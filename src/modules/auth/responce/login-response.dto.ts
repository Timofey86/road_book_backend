import {ApiProperty} from "@nestjs/swagger";

export class LoginResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIs...',
    })
    accessToken: string;
}