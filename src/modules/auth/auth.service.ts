import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import {UsersService} from "../users/users.service";
import * as bcrypt from 'bcrypt';
import {RegisterDto} from "./dto/register.dto";
import {Prisma} from "../../generated/prisma/client";
import {UserResponseDto} from "../users/response/user-response.dto";
import {JwtService} from "@nestjs/jwt";
import {LoginDto} from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {
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

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash)

        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid password or email');
        }

        const token = await this.signToken(user.id, user.email)

        return {
            accessToken: token,
        }
    }

    private signToken(userId: number, email: string) {
        return this.jwtService.signAsync({
            sub: userId,
            email,
        })
    }
}
