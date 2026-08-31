import {BadGatewayException, Injectable, Logger} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {RoutingResult} from "./types/routing-result";
import {firstValueFrom} from "rxjs";
import {OrsDirectionsResponse} from "./types/ors-directions-response";
import {AxiosError} from "axios";

@Injectable()
export class RoutingService {
    private readonly logger = new Logger(RoutingService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
    }

    async buildRoute(
        coordinates: [number, number][],
    ): Promise<RoutingResult> {
        try {
            const apiKey = this.configService.getOrThrow<string>('ORS_API_KEY');

            const response = await firstValueFrom(
                this.httpService.post<OrsDirectionsResponse>(
                    'https://api.heigit.org/openrouteservice/v2/directions/driving-car/geojson',
                    {
                        coordinates,
                    },
                    {
                        headers: {
                            Authorization: apiKey,
                            'Content-Type': 'application/json',
                        },
                        timeout: 5000
                    }
                )
            )

            const feature = response.data.features[0]

            if (!feature) {
                this.logger.error('Routing service returned no route');

                throw new BadGatewayException(
                    'Routing service returned no route',
                );
            }

            return {
                distanceMeters: feature.properties.summary.distance,
                durationSeconds: feature.properties.summary.duration,
                geometry: feature.geometry
            }
        } catch (error) {

            if (error instanceof BadGatewayException) {
                throw error;
            }

            if (error instanceof AxiosError) {
                this.logger.error(
                    `Routing request failed: status=${error.response?.status}, message=${error.message}`,
                );
            } else {
                this.logger.error(
                    'Unknown routing error',
                    error instanceof Error
                        ? error.stack
                        : undefined,
                );
            }

            throw new BadGatewayException(
                'Routing service is currently unavailable',
            );
        }
    }

}
