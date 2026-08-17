import {Body, Controller, Get, Patch, UseGuards} from '@nestjs/common';
import {UsersService} from "./users.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {UpdateUserDto} from "./dto/update-user.dto";
import {UserResponseDto} from "./response/user-response.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}

    @Get()
    findAll(){
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: JwtUser) {
        return this.usersService.findById(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
        return this.usersService.update(user.id, dto);
    }

}
