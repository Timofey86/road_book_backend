export interface OrsGeocodingResponse {
    features: OrsFeature[];
}

export interface OrsFeature {
    geometry: {
        coordinates: [number, number];
    };

    properties: {
        name: string;
        label?: string;
        locality?: string;
        country?: string;
        country_a?: string;
    };
}