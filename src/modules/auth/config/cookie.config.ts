import type {CookieOptions} from "express";

export function getAccessCookieOptions(isProduction: boolean): CookieOptions {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
    }
}

export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
}