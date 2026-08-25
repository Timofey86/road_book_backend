import {Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import {RoutesService} from "./routes.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CreateRouteDto} from "./dto/create-route.dto";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";
import {ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse} from "@nestjs/swagger";
import {RouteDetailsResponseDto} from "./response/route-details-response.dto";

@Controller('routes')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiCreatedResponse({
        description: 'Route successfully created',
        type: RouteCreatedResponseDto,
    })
    create(
        @Body() dto: CreateRouteDto,
        @CurrentUser() user: JwtUser
    ):Promise<RouteCreatedResponseDto> {
        return this.routesService.create(user.id, dto);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
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
    ): Promise<RouteDetailsResponseDto>{
        return this.routesService.findOne(id, user.id);
    }
}
