import {
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards
} from '@nestjs/common';
import {RouteStopsService} from "./route-stops.service";
import {
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags
} from "@nestjs/swagger";
import {RouteStopResponseDto} from "./response/route-stop-response.dto";
import {CreateRouteStopDto} from "./dto/create-route-stop.dto";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {UpdateRouteStopDto} from "./dto/update-route-stop.dto";
import {ReorderRouteStopsDto} from "./dto/reorder-route-stops.dto";

@ApiTags('Route Stops')
@Controller('route-stops')
export class RouteStopsController {
    constructor(private readonly routeStopsService: RouteStopsService) {
    }

    @Post(':routeId/stops')
    @UseGuards(JwtAuthGuard)
    @ApiCreatedResponse({
        description: 'Route stop successfully created',
        type: RouteStopResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot modify this route',
    })
    create(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Body() dto: CreateRouteStopDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteStopResponseDto> {
        return this.routeStopsService.create(
            routeId,
            user.id,
            dto
        )
    }

    @Patch(':routeId/stops/reorder')
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Route stops successfully reordered',
        type: [RouteStopResponseDto],
    })
    @ApiNotFoundResponse({
        description: 'Route or route stop not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot modify this route',
    })
    reorder(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Body() dto: ReorderRouteStopsDto,
        @CurrentUser() user: JwtUser,
    ): Promise<RouteStopResponseDto[]> {
        return this.routeStopsService.reorder(
            routeId,
            user.id,
            dto,
        );
    }

    @Patch(':routeId/stops/:stopId')
    @UseGuards(JwtAuthGuard)
    @ApiOkResponse({
        description: 'Route stop successfully updated',
        type: RouteStopResponseDto,
    })
    @ApiNotFoundResponse({
        description: 'Route or route stop not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot modify this route',
    })
    update(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
        @Body() dto: UpdateRouteStopDto,
        @CurrentUser() user: JwtUser
    ): Promise<RouteStopResponseDto> {
        return this.routeStopsService.update(
            routeId,
            stopId,
            user.id,
            dto,
        );
    }

    @Delete(':routeId/stops/:stopId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({
        description: 'Route stop successfully deleted',
    })
    @ApiNotFoundResponse({
        description: 'Route or route stop not found',
    })
    @ApiForbiddenResponse({
        description: 'You cannot modify this route',
    })
    delete(
        @Param('routeId', ParseIntPipe) routeId: number,
        @Param('stopId', ParseIntPipe) stopId: number,
        @CurrentUser() user: JwtUser
    ): Promise<void> {
        return this.routeStopsService.remove(
            routeId,
            stopId,
            user.id,
        );
    }
}
