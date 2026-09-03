import {
    Body,
    Controller, Delete, FileTypeValidator,
    Get, HttpCode, HttpStatus,
    MaxFileSizeValidator, Param, ParseFilePipe, ParseIntPipe,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {UsersService} from "./users.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {UpdateUserDto} from "./dto/update-user.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {
    ApiBody,
    ApiConsumes, ApiCookieAuth,
    ApiCreatedResponse, ApiNoContentResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags, ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {CurrentUserResponseDto} from "./response/current-user-response.dto";
import {PublicUserResponseDto} from "./response/public-user-response.dto";

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiOkResponse({
        description: 'User profile successfully updated',
        type: CurrentUserResponseDto,
    })
    @ApiOperation({
        summary: 'Update current user profile',
        description:
            'Updates profile information of the currently authenticated user.',
    })
    updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto): Promise<CurrentUserResponseDto> {
        return this.usersService.update(user.id, dto);
    }

    @Post('me/avatar')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiOperation({
        summary: 'Upload user avatar',
        description:
            'Uploads or replaces the avatar of the currently authenticated user.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Avatar image (JPEG, PNG or WebP, max 5 MB)',
                },
            },
            required: ['avatar'],
        },
    })
    @ApiCreatedResponse({
        description: 'Avatar successfully uploaded',
        type: CurrentUserResponseDto,
    })
    @UseInterceptors(FileInterceptor('avatar'))
    uploadAvatar(
        @CurrentUser() user: JwtUser,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 5 * 1024 * 1024,
                    }),
                    new FileTypeValidator({
                        fileType: /^image\/(jpeg|png|webp)$/,
                    }),
                ],
                fileIsRequired: true,
            }),
        ) file: Express.Multer.File
    ):Promise<CurrentUserResponseDto> {
        return this.usersService.uploadAvatar(user.id, file);
    }

    @Delete('me/avatar')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiOkResponse({
        description: 'Avatar successfully deleted',
        type: CurrentUserResponseDto,
    })
    @ApiOperation({
        summary: 'Delete user avatar',
        description:
            'Deletes the avatar of the currently authenticated user.',
    })
    deleteAvatar(@CurrentUser() user: JwtUser):Promise<CurrentUserResponseDto> {
        return this.usersService.deleteAvatar(user.id);
    }

    @Delete('me')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete current user account',
        description:
            'Deletes the currently authenticated user account.',
    })
    @ApiNoContentResponse({
        description: 'User deleted successfully',
    })
    async deleteUser(@CurrentUser() user: JwtUser): Promise<void> {
        await this.usersService.deleteUser(user.id);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get public user profile',
        description:
            'Returns public profile information for the specified user.',
    })
    @ApiOkResponse({
        description: 'Public user profile',
        type: PublicUserResponseDto,
    })
    getPublicProfile(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<PublicUserResponseDto> {
        return this.usersService.findPublicProfile(id);
    }
}
