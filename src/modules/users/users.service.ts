import {ConflictException, Injectable} from '@nestjs/common';
import {PrismaService} from "../../prisma/prisma.service";
import {UserResponseDto} from "./response/user-response.dto";
import {UpdateUserDto} from "./dto/update-user.dto";
import {Prisma} from "../../generated/prisma/client";

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    findAll() {
        return this.prismaService.user.findMany({
            omit: {
                passwordHash: true,
            },
        });
    }

    findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: { email },
        });
    }

    create(data: {
        name: string;
        email: string;
        passwordHash: string;
        bio?: string;
    }) {
        return this.prismaService.user.create({
            data,
            omit: {
                passwordHash: true,
            },
        });
    }

    findById(id: number): Promise<UserResponseDto | null> {
        return this.prismaService.user.findUnique({
            where: { id },
            omit: {
                passwordHash: true,
            },
        });
    }

    async update(
        id: number,
        dto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        try {
            return await this.prismaService.user.update({
                where: { id },
                data: dto,
                omit: {
                    passwordHash: true,
                },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('User with this email already exists');
            }

            throw error;
        }
    }
}
