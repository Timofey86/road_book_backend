import {
    Body,
    Controller, Delete, FileTypeValidator,
    Get, HttpCode, HttpStatus,
    MaxFileSizeValidator, ParseFilePipe,
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
import {UserResponseDto} from "./response/user-response.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation, ApiResponse,
    ApiTags, ApiUnauthorizedResponse
} from "@nestjs/swagger";

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
    description: 'Unauthorized',
})
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}

    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns the profile of the currently authenticated user.',
    })
    @ApiOkResponse({
        description: 'Current user profile',
        type: UserResponseDto,
    })
    @Get('me')
    getMe(@CurrentUser() user: JwtUser):Promise<UserResponseDto | null> {
        return this.usersService.findById(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    @ApiOkResponse({
        description: 'User profile successfully updated',
        type: UserResponseDto,
    })
    @ApiOperation({
        summary: 'Update current user profile',
        description:
            'Updates profile information of the currently authenticated user.',
    })
    updateMe(@CurrentUser() user: JwtUser, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
        return this.usersService.update(user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('me/avatar')
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
        type: UserResponseDto,
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
    ):Promise<UserResponseDto> {
        return this.usersService.uploadAvatar(user.id, file);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/avatar')
    @ApiOkResponse({
        description: 'Avatar successfully deleted',
        type: UserResponseDto,
    })
    @ApiOperation({
        summary: 'Delete user avatar',
        description:
            'Deletes the avatar of the currently authenticated user.',
    })
    deleteAvatar(@CurrentUser() user: JwtUser):Promise<UserResponseDto> {
        return this.usersService.deleteAvatar(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiResponse({
        status: HttpStatus.NO_CONTENT,
        description: 'User deleted successfully',
    })
    deleteUser(@CurrentUser() user: JwtUser): Promise<void> {
        return this.usersService.deleteUser(user.id);
    }
}
