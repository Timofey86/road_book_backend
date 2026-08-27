import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post, Query,
    UseGuards
} from '@nestjs/common';
import {RoutesService} from "./routes.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CreateRouteDto} from "./dto/create-route.dto";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";
import {
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse, ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags
} from "@nestjs/swagger";
import {RouteDetailsResponseDto} from "./response/route-details-response.dto";
import {UpdateRouteDto} from "./dto/update-route.dto";
import {RoutesPaginatedResponseDto} from "./response/routes-paginated-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";

@Controller('routes')
@ApiTags('Routes')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) {
    }

    @Post()
    @ApiCreatedResponse({
        description: 'Route successfully created',
        type: RouteCreatedResponseDto,
    })
    create(
        @Body() dto: CreateRouteDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteCreatedResponseDto> {
        return this.routesService.create(user.id, dto);
    }

    @Get('my')
    @ApiOkResponse({
        description: 'Routes successfully received',
        type: RoutesPaginatedResponseDto
    })
    findMyRoutes(@CurrentUser() user: JwtUser, @Query() query: PaginationQueryDto,) {
        return this.routesService.getRoutesByUser(user.id, query.page, query.limit);
    }

    @Get(':id')
    @ApiOkResponse({
        description: 'Route successfully received',
        type: RouteDetailsResponseDto
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: JwtUser
    ): Promise<RouteDetailsResponseDto> {
        return this.routesService.findOne(id, user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Route successfully updated',
        type: RouteCreatedResponseDto,
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
    ): Promise<RouteCreatedResponseDto> {
        return this.routesService.update(id, user.id, dto);
    }

    @Delete(':id')
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
}
