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

@Controller('routes')
@ApiTags('Routes')
@ApiCookieAuth('access_token')
export class RoutesController {
    constructor(
        private readonly routesService: RoutesService,
        private readonly queryService: RoutesQueryService
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiCreatedResponse({
        description: 'Route successfully created',
        type: RouteResponseDto,
    })
    create(
        @Body() dto: CreateRouteDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteResponseDto> {
        return this.routesService.create(user.id, dto);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Routes successfully received',
        type: RoutesPaginatedResponseDto
    })
    findMyRoutes(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto,) {
        return this.queryService.getRoutesByUser(user.id, query.page, query.limit);
    }

    @Get()
    @ApiOkResponse({
        description: 'Routes successfully received',
        type: RoutesPaginatedResponseDto,
    })
    findAll(
        @Query() query: RoutesQueryDto,
    ): Promise<RoutesPaginatedResponseDto> {
        return this.queryService.findAll(query);
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
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
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Route successfully updated',
        type: RouteResponseDto,
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
    @UseGuards(JwtAuthGuard)
    @ApiNoContentResponse({
        description: 'Route successfully deleted',
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
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Replace route tags',
    })
    @ApiOkResponse({
        description: 'Route tags updated successfully',
        type: RouteResponseDto,
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
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
            fileFilter: (_req, file, callback) => {
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ];

                if (!allowedMimeTypes.includes(file.mimetype)) {
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
                },
            },
            required: ['file'],
        },
    })
    @ApiOkResponse({
        description: 'Route cover uploaded successfully',
        type: RouteCoverResponseDto,
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
