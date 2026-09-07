import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post, Put, Query, UploadedFile,
    UseGuards, UseInterceptors
} from '@nestjs/common';
import {RoutesService} from "./services/routes.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CreateRouteDto} from "./dto/create-route.dto";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {RouteResponseDto} from "./response/route-response.dto";
import {
    ApiBadGatewayResponse,
    ApiBadRequestResponse, ApiBody, ApiConsumes,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse, ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse, ApiOperation,
    ApiTags, ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {RouteDetailsResponseDto} from "./response/route-details-response.dto";
import {UpdateRouteDto} from "./dto/update-route.dto";
import {RoutesPaginatedResponseDto} from "./response/routes-paginated-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";
import {RoutesQueryDto} from "./dto/routes-query.dto";
import {OptionalJwtAuthGuard} from "../auth/jwt-optional-auth.guard";
import {RouteBuildResponseDto} from "./response/route-build-response.dto";
import {RoutesQueryService} from "./services/routes-query.service";
import {UpdateRouteTagsDto} from "./dto/update-route-tags.dto";
import {FileInterceptor} from "@nestjs/platform-express";
import {RouteCoverResponseDto} from "./response/route-cover-response.dto";
import {isAllowedImageMimeType} from "../../common/utils/image.utils";

@Controller('routes')
@ApiTags('Routes')
export class RoutesController {
    constructor(
        private readonly routesService: RoutesService,
        private readonly queryService: RoutesQueryService
    ) {}

    @Post()
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Create route',
        description: 'Creates a new route for the authenticated user.',
    })
    @ApiCreatedResponse({
        description: 'Route successfully created',
        type: RouteResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiBadRequestResponse({
        description: 'Invalid route data',
    })
    create(
        @Body() dto: CreateRouteDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteResponseDto> {
        return this.routesService.create(user.id, dto);
    }

    @Get('my')
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Get my routes',
        description: 'Returns paginated routes created by the authenticated user.',
    })
    @ApiOkResponse({
        description: 'Routes successfully received',
        type: RoutesPaginatedResponseDto
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    findMyRoutes(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto,) {
        return this.queryService.getRoutesByUser(user.id, query.page, query.limit);
    }

    @Get()
    @ApiOperation({
        summary: 'Get routes',
        description:
            'Returns paginated routes with optional search, filtering and sorting.',
    })
    @ApiOkResponse({
        description: 'Routes successfully received',
        type: RoutesPaginatedResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'Invalid query parameters',
    })
    findAll(
        @Query() query: RoutesQueryDto,
    ): Promise<RoutesPaginatedResponseDto> {
        return this.queryService.findAll(query);
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiOperation({
        summary: 'Get route details',
        description:
            'Returns route details. Authentication is optional and is used to determine like and favorite state.',
    })
    @ApiBadRequestResponse({
        description: 'Invalid route id',
    })
    @ApiOkResponse({
        description: 'Route successfully received',
        type: RouteDetailsResponseDto
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtUser | null
    ): Promise<RouteDetailsResponseDto> {
        // console.log('CURRENT USER:', user);
        return this.routesService.findOne(id, user?.id);
    }

    @Patch(':id')
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Update route',
        description:
            'Updates title or description of a route owned by the authenticated user.',
    })
    @ApiOkResponse({
        description: 'Route successfully updated',
        type: RouteResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiBadRequestResponse({
        description: 'Invalid route id or route data',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot edit this route',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRouteDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteResponseDto> {
        return this.routesService.update(id, user.id, dto);
    }

    @Delete(':id')
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiNoContentResponse({
        description: 'Route successfully deleted',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiBadRequestResponse({
        description: 'Invalid route id',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot delete this route',
    })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtUser,
    ): Promise<void> {
        await this.routesService.remove(id, user.id);
    }

    @Post(':id/build')
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Build route using saved stops',
    })
    @ApiOkResponse({
        description: 'Route built successfully',
        type: RouteBuildResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the owner of the route',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    @ApiBadRequestResponse({
        description: 'Route must contain at least 2 stops',
    })
    @ApiBadGatewayResponse({
        description: 'Routing service is currently unavailable',
    })
    buildRoute(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtUser,
    ): Promise<RouteBuildResponseDto> {
        return this.routesService.buildRoute(id, user.id);
    }

    @Put(':id/tags')
    @ApiCookieAuth('access_token')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Replace route tags',
    })
    @ApiOkResponse({
        description: 'Route tags updated successfully',
        type: RouteResponseDto,
    })
    @ApiBadRequestResponse({
        description: 'Invalid tags or route id',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the owner of the route',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    updateTags(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtUser,
        @Body() dto: UpdateRouteTagsDto,
    ): Promise<RouteResponseDto> {
        return this.routesService.updateTags(id, user.id, dto);
    }

    @Post(':id/cover')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, callback) => {
                if (!isAllowedImageMimeType(file.mimetype)) {
                    return callback(
                        new BadRequestException({
                            code: 'ALLOWED_IMAGE_TYPES'
                        }),
                        false,
                    );
                }

                callback(null, true);
            },
        }),
    )
    @ApiOperation({
        summary: 'Upload or replace route cover',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Route cover image (JPEG, PNG or WebP, max 5 MB)',
                },
            },
            required: ['file'],
        },
    })
    @ApiOkResponse({
        description: 'Route cover uploaded successfully',
        type: RouteCoverResponseDto,
    })
    @ApiBadRequestResponse({
        description:
            'Invalid image, unsupported image type or file exceeds 5 MB',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiForbiddenResponse({
        description: 'User is not the owner of the route',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    uploadCover(
        @Param('id', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<RouteCoverResponseDto> {
        return this.routesService.uploadCover(routeId, user.id, file);
    }
}
