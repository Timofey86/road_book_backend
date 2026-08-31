export interface RoutingResult {
    distanceMeters: number;
    durationSeconds: number;

    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}