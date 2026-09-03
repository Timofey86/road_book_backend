import {
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {FavoritesService} from "./favorites.service";
import {FavoriteResponseDto} from "./response/favorite-response.dto";
import {CurrentUser} from "../../common/decorators/current-user.decorator";
import type {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {FavoritesPaginatedResponseDto} from "./response/favorites-paginated-response.dto";
import {PaginationQueryDto} from "../../common/pagination/dto/pageination-query.dto";

@ApiTags('Favorites')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller()
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}

    @Post('routes/:routeId/favorite')
    @ApiOperation({
        summary: 'Add route to favorites',
    })
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: FavoriteResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    add(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() currentUser: JwtUser,
    ): Promise<FavoriteResponseDto> {
        return this.favoritesService.add(
            routeId,
            currentUser.id,
        );
    }

    @Delete('routes/:routeId/favorite')
    @ApiOperation({
        summary: 'Remove route from favorites',
    })
    @ApiOkResponse({
        type: FavoriteResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiNotFoundResponse({
        description: 'Route not found',
    })
    remove(
        @Param('routeId', ParseIntPipe) routeId: number,
        @CurrentUser() currentUser: JwtUser,
    ): Promise<FavoriteResponseDto> {
        return this.favoritesService.remove(
            routeId,
            currentUser.id,
        );
    }

    @Get('favorites')
    @ApiOperation({
        summary: 'Get current user favorite routes',
    })
    @ApiOkResponse({
        type: FavoritesPaginatedResponseDto,
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    findAll(
        @CurrentUser() currentUser: JwtUser,
        @Query() query: PaginationQueryDto,
    ): Promise<FavoritesPaginatedResponseDto> {
        return this.favoritesService.findAll(
            currentUser.id,
            query,
        );
    }
}
