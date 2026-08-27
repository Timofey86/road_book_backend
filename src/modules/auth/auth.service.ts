import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import {UsersService} from "../users/users.service";
import * as bcrypt from 'bcrypt';
import {RegisterDto} from "./dto/register.dto";
import {Prisma} from "../../generated/prisma/client";
import {UserResponseDto} from "../users/response/user-response.dto";
import {JwtService} from "@nestjs/jwt";
import {LoginDto} from "./dto/login.dto";
import {ConfigService} from "@nestjs/config";
import {JwtPayload} from "../../common/interfaces/jwt-user.interface";

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService,
                private readonly jwtService: JwtService,
                private readonly configService: ConfigService,
    ) {
    }

    async register(dto: RegisterDto): Promise<UserResponseDto> {
        try {
            const existingUser = await this.usersService.findByEmail(dto.email);

            if (existingUser) {
                throw new ConflictException('User with this email already exists');
            }

            const passwordHash = await bcrypt.hash(dto.password, 10);

            const user = await this.usersService.create({
                name: dto.name,
                email: dto.email,
                passwordHash,
                bio: dto.bio,
            });

            return this.usersService.toResponseDto(user);
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'User with this email already exists',
                );
            }

            throw error;
        }
    }

    async login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid password or email');
        }

        const [accessToken, refreshToken] = await Promise.all([
            this.createAccessToken(user.id, user.email),
            this.createRefreshToken(user.id, user.email),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private createAccessToken(userId: number, email: string) {
        return this.jwtService.signAsync(
            {
                sub: userId,
                email,
            },
            {
                secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            }
        )
    }

    private createRefreshToken(
        userId: number,
        email: string,
    ): Promise<string> {
        return this.jwtService.signAsync(
            {
                sub: userId,
                email,
            },
            {
                secret: this.configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),
                expiresIn: '7d',
            },
        );
    }

    async refresh(refreshToken: string): Promise<string> {
        try {
            const payload =
                await this.jwtService.verifyAsync<JwtPayload>(
                    refreshToken,
                    {
                        secret:
                            this.configService.getOrThrow<string>(
                                'JWT_REFRESH_SECRET',
                            ),
                    },
                );

            return this.createAccessToken(
                payload.sub,
                payload.email,
            );
        } catch {
            throw new UnauthorizedException(
                'Invalid refresh token',
            );
        }
    }
}
