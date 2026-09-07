import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import {
    ApiBadGatewayResponse, ApiBadRequestResponse,
    ApiCookieAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {PlacesService} from "./places.service";
import {PlaceSearchResponseDto} from "./response/places-search-response.dto";
import {PlacesSearchQueryDto} from "./dto/places-search-query.dto";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags('Places')
@Controller('places')
export class PlacesController {
    constructor(private readonly placesService: PlacesService) {}

    @Get('search')
    @UseGuards(JwtAuthGuard)
    @ApiCookieAuth('access_token')
    @ApiOperation({
        summary: 'Search places',
        description: 'Searches for places using the external geocoding service.',
    })
    @ApiOkResponse({
        description: 'Places found successfully',
        type: [PlaceSearchResponseDto],
    })
    @ApiUnauthorizedResponse({
        description: 'Unauthorized',
    })
    @ApiBadGatewayResponse({
        description: 'Geocoding service is currently unavailable',
    })
    @ApiBadRequestResponse({
        description: 'Invalid place search query',
    })
    async search(
        @Query() query: PlacesSearchQueryDto,
    ): Promise<PlaceSearchResponseDto[]> {
        return this.placesService.search(query.q);
    }
}
