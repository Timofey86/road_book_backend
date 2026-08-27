export interface JwtUser {
    id: number;
    email: string;
}

export interface JwtPayload {
    sub: number;
    email: string;
}