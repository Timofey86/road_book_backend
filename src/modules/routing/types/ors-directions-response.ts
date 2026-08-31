export interface OrsDirectionsResponse {
    features: OrsDirectionsFeature[];
}

interface OrsDirectionsFeature {
    properties: {
        summary: {
            distance: number;
            duration: number;
        };
    };

    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}