import {BadGatewayException, Injectable, Logger} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {ConfigService} from "@nestjs/config";
import {RoutingResult} from "./types/routing-result";
import {firstValueFrom} from "rxjs";
import {OrsDirectionsResponse} from "./types/ors-directions-response";
import {AxiosError, AxiosResponse} from "axios";

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

        const apiKey = this.configService.getOrThrow<string>('ORS_API_KEY');
        let response: AxiosResponse<OrsDirectionsResponse>;

        try {
            response = await firstValueFrom(
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

        } catch (error) {
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

            throw new BadGatewayException({
                code: 'ROUTING_SERVICE_ERROR',
                message: 'Routing service is currently unavailable',
            });
        }

        const feature = response.data.features[0]

        if (!feature) {
            this.logger.error('Routing service returned no route');

            throw new BadGatewayException({
                code: 'ROUTING_ROUTE_NOT_FOUND',
                message: 'Routing service returned no route',
            });
        }

        return {
            distanceMeters: feature.properties.summary.distance,
            durationSeconds: feature.properties.summary.duration,
            geometry: feature.geometry
        }
    }
}
