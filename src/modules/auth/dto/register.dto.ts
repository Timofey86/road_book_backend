import {
    IsEmail, IsNotEmpty,
    IsOptional,
    IsString, Matches,
    MaxLength,
    MinLength,
} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @ApiProperty({
        example: 'John Doe',
    })
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    @ApiProperty({
        example: 'johndoe@gmail.com',
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(72)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter and one number',
    })
    @ApiProperty({
        description: 'Password must contain at least one uppercase letter, one lowercase letter and one number'
    })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    @ApiProperty({
        example: 'Road trip enthusiast',
        nullable: true,
    })
    bio?: string;
}