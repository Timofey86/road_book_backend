import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards
} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {RegisterDto} from "./dto/register.dto";
import {LoginDto} from "./dto/login.dto";
import type { Response, Request } from 'express';

import {
    ApiConflictResponse, ApiCookieAuth,
    ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {ConfigService} from "@nestjs/config";
import {getAccessCookieOptions, getRefreshCookieOptions} from "./config/cookie.config";
import {CurrentUserResponseDto} from "../users/response/current-user-response.dto";
import {JwtAuthGuard} from "./jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,
                private readonly configService: ConfigService
    ) {}

    @Post('register')
    @ApiOperation({
        summary: 'Register a new user',
        description: 'Creates a new user account.',
    })
    @ApiCreatedResponse({
        description: 'User successfully registered',
        type: CurrentUserResponseDto,
    })
    @ApiConflictResponse({
        description: 'User with this email already exists',
    })
    register(@Body() dto: RegisterDto): Promise<CurrentUserResponseDto> {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Login user',
        description:
            'Authenticates the user and stores access and refresh JWTs in HttpOnly cookies.',
    })
    @ApiNoContentResponse({
        description:
            'Login successful. Access and refresh tokens were stored in HttpOnly cookies.',
    })
    @ApiUnauthorizedResponse({
        description: 'Invalid email or password',
    })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response
    ): Promise<void> {
        const { accessToken, refreshToken } = await this.authService.login(dto);
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
        response.cookie(
            'access_token',
            accessToken,
            getAccessCookieOptions(isProduction),
        );

        response.cookie(
            'refresh_token',
            refreshToken,
            getRefreshCookieOptions(isProduction),
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiOperation({
        summary: 'Get current authenticated user',
    })
    @ApiOkResponse({
        description: 'Current authenticated user',
        type: CurrentUserResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    getMe(@CurrentUser() user: JwtUser): Promise<CurrentUserResponseDto> {
        return this.authService.getMe(user.id);
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Logout user',
        description:
            'Removes access and refresh authentication cookies.',
    })
    @ApiNoContentResponse({
        description: 'User successfully logged out',
    })
    logout(
        @Res({ passthrough: true }) response: Response,
    ): void {
        const isProduction =
            this.configService.get<string>('NODE_ENV') === 'production';

        response.clearCookie(
            'access_token',
            getAccessCookieOptions(isProduction),
        );

        response.clearCookie(
            'refresh_token',
            getRefreshCookieOptions(isProduction),
        );
    }

    @Post('refresh')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Refresh access token',
        description:
            'Uses the refresh token from an HttpOnly cookie to issue a new access token.',
    })
    @ApiNoContentResponse({
        description:
            'Access token successfully refreshed and stored in the access_token cookie.',
    })
    @ApiUnauthorizedResponse({
        description: 'Refresh token is missing, invalid or expired',
    })
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const refreshToken =
            request.cookies?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is missing');
        }

        const accessToken =
            await this.authService.refresh(refreshToken);

        const isProduction =
            this.configService.get<string>('NODE_ENV') === 'production';

        response.cookie(
            'access_token',
            accessToken,
            getAccessCookieOptions(isProduction),
        );
    }
}
