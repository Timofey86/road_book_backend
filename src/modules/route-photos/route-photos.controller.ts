import {
    BadRequestException,
    Body,
    Controller, Delete, HttpCode, HttpStatus,
    Param,
    ParseIntPipe, Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes, ApiCookieAuth,
    ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {RoutePhotosService} from "./route-photos.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {FileInterceptor} from "@nestjs/platform-express";
import {RoutePhotoResponseDto} from "./response/route-photos-response.dto";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {UploadRoutePhotoDto} from "./dto/upload-route-photo.dto";
import {isAllowedImageMimeType} from "../../common/utils/image.utils";
import {UpdateRoutePhotoDto} from "./dto/update-route-photo.dto";
import {ReorderRoutePhotosDto} from "./dto/reorder-route-photo.dto";

@ApiTags('Route Photos')
@ApiCookieAuth('access_token')
@Controller('routes/:routeId/photos')
export class RoutePhotosController {
    constructor(private readonly routePhotosService: RoutePhotosService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize:
                    5 * 1024 * 1024,
            },
            fileFilter: (
                _req,
                file,
                callback,
            ) => {
                if (!isAllowedImageMimeType(file.mimetype)) {
                    return callback(
                        new BadRequestException(
                            'Only JPEG, PNG and WebP images are allowed',
                        ),
                        false,
                    );
                }
                callback(null, true);
            },
        }),
    )
    @ApiOperation({
        summary:
            'Upload route photo',
    })
    @ApiConsumes(
        'multipart/form-data',
    )
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                caption: {
                    type: 'string',
                    example: 'View from the Alps',
                    maxLength: 500,
                },
            },
            required: ['file'],
        },
    })
    @ApiCreatedResponse({
        type: RoutePhotoResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description:
            'User is not the route owner',
    })
    @ApiNotFoundResponse({
        description:
            'Route not found',
    })
    upload(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadRoutePhotoDto,
    ): Promise<RoutePhotoResponseDto> {
        return this.routePhotosService.upload(
            routeId,
            user.id,
            file,
            dto.caption,
        );
    }

    @Delete(':photoId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete route photo',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the route owner',
    })
    @ApiNotFoundResponse({
        description: 'Route or photo not found',
    })
    async remove(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('photoId', ParseIntPipe) photoId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<void> {
        await this.routePhotosService.remove(
            routeId,
            photoId,
            user.id,
        );
    }

    @Patch('reorder')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Reorder route photos',
    })
    @ApiOkResponse({
        type: [RoutePhotoResponseDto],
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the route owner',
    })
    @ApiNotFoundResponse({
        description: 'Route or photo not found',
    })
    reorder(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
        @Body() dto: ReorderRoutePhotosDto,
    ): Promise<RoutePhotoResponseDto[]> {
        return this.routePhotosService.reorder(
            routeId,
            user.id,
            dto,
        );
    }

    @Patch(':photoId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Update route photo',
    })
    @ApiOkResponse({
        type: RoutePhotoResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the route owner',
    })
    @ApiNotFoundResponse({
        description: 'Route or photo not found',
    })
    update(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('photoId', ParseIntPipe) photoId: number,
        @CurrentUser() user: JwtUser,
        @Body() dto: UpdateRoutePhotoDto,
    ): Promise<RoutePhotoResponseDto> {
        return this.routePhotosService.update(
            routeId,
            photoId,
            user.id,
            dto,
        );
    }
}
