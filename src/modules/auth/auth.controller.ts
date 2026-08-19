import {Body, Controller, Post} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {RegisterDto} from "./dto/register.dto";
import {UserResponseDto} from "../users/response/user-response.dto";
import {LoginDto} from "./dto/login.dto";
import {
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {LoginResponseDto} from "./responce/login-response.dto";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({
        type: UserResponseDto,
    })
    @ApiConflictResponse({
        description: 'User with this email already exists',
    })
    register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
        return this.authService.register(dto);
    }

    @ApiOperation({
        summary: 'Login user',
    })
    @ApiOkResponse({
        type: LoginResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid email or password',
    })
    @Post('login')
    login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
        return this.authService.login(dto);
    }
}
