import {BadGatewayException, Injectable, Logger} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {firstValueFrom} from 'rxjs';
import {OrsGeocodingResponse} from './types/ors-geocoding-response';
import {PlaceSearchResponseDto} from "./response/places-search-response.dto";
import * as countries from 'i18n-iso-countries';
import {AxiosError} from "axios";


@Injectable()
export class PlacesService {
    private readonly logger = new Logger(PlacesService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
    }

    async search(query: string): Promise<PlaceSearchResponseDto[]> {
        try {
            const apiKey = this.configService.getOrThrow<string>('ORS_API_KEY')

            const response = await firstValueFrom(
                this.httpService.get<OrsGeocodingResponse>(
                    // 'https://api.heigit.org/pelias/v1/search',
                    'https://api.openrouteservice.org/geocode/search',
                    // todo 'https://api.openrouteservice.org/geocode/search' - без учета лимита до 28.09 надопоменять на 1 урл
                    {
                        headers: {
                            Authorization: apiKey,
                        },
                        params: {
                            text: query,
                            size: 5,
                        },
                        timeout: 5000
                    },
                )
            )
            return response.data.features.map((feature) => {
                const [longitude, latitude] =
                    feature.geometry.coordinates;

                return {
                    name: feature.properties.name,
                    address: feature.properties.label ?? null,
                    cityName: feature.properties.locality ?? null,
                    countryName: feature.properties.country ?? null,
                    countryCode: countries.alpha3ToAlpha2(
                        feature.properties.country_a ?? '',
                    ) ?? null,
                    latitude,
                    longitude,
                };
            });
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    `Geocoding request failed: status=${error.response?.status}, message=${error.message}`,
                );
            } else {
                this.logger.error(
                    'Unknown geocoding error',
                    error instanceof Error
                        ? error.stack
                        : undefined,
                );
            }

            throw new BadGatewayException({
                code: 'GEOCODING_SERVICE_ERROR',
                message: 'Geocoding service is currently unavailable',
            });
        }
    }
}
