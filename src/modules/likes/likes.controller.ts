import {Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {LikesService} from "./likes.service";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import {LikeResponseDto} from "./response/like-response.dto";

@ApiTags('Likes')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('routes/:routeId/like')
export class LikesController {
    constructor(private readonly likesService: LikesService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Like a route',
    })
    @ApiOkResponse({
        type: LikeResponseDto,
        description: 'Route liked successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    like(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<LikeResponseDto> {
        return this.likesService.like(routeId, user.id);
    }

    @Delete()
    @ApiOperation({
        summary: 'Unlike a route',
    })
    @ApiOkResponse({
        type: LikeResponseDto,
        description: 'Route unliked successfully',
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    @ApiBadRequestResponse({
        description: 'Invalid route id',
    })
    unlike(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() user: JwtUser,
    ): Promise<LikeResponseDto> {
        return this.likesService.unlike(
            routeId,
            user.id,
        );
    }
}
