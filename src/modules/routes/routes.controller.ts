import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import {RoutesService} from "./routes.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {CreateRouteDto} from "./dto/create-route.dto";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {RouteCreatedResponseDto} from "./response/route-created-response.dto";
import {ApiCreatedResponse} from "@nestjs/swagger";

@Controller('routes')
export class RoutesController {
    constructor(private readonly routesService: RoutesService) {}

    @UseGuards(JwtAuthGuard)
    @Post('add')
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
}
