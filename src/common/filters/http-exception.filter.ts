import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus, Logger,
} from '@nestjs/common';

import type {Request, Response} from 'express';
import {
    I18nContext,
    I18nService,
} from 'nestjs-i18n';
import {JwtUser} from "../interfaces/jwt-user.interface";

type ErrorResponseData = {
    code: string;
    details: unknown[];
    args: Record<string, unknown>;
};

type AuthenticatedRequest = Request & {
    user?: JwtUser;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
    constructor(private readonly i18n: I18nService) {}

    catch(
        exception: unknown,
        host: ArgumentsHost,
    ): void {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<AuthenticatedRequest>();

        if (!(exception instanceof HttpException)) {
            const error =
                exception instanceof Error
                    ? exception
                    : new Error(String(exception));

            this.logger.error(
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    service: 'roadbook-api',
                    requestId: request.requestId,
                    userId: request.user?.id ?? null,
                    method: request.method,
                    path: request.originalUrl,
                    errorName: error.name,
                    message: error.message,
                    stack: error.stack,
                }),
            );
        }

        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : null;

        const {
            code,
            details,
            args,
        } = this.buildErrorResponse(
            statusCode,
            exceptionResponse,
        );

        const i18nContext = I18nContext.current();
        const lang = i18nContext?.lang ?? 'en';
        const message = this.i18n.t(
            `errors.${code}`,
            {
                lang,
                args,
            },
        );

        response
            .status(statusCode)
            .json({
                statusCode,
                code,
                message,
                details,
                requestId:
                request.requestId,
                timestamp:
                    new Date().toISOString(),
                path:
                request.originalUrl,
            });
    }

    private buildErrorResponse(
        statusCode: number,
        exceptionResponse:
            string | object | null,
    ): ErrorResponseData {
        if (typeof exceptionResponse === 'string') {
            return {
                code:
                    this.getErrorCode(
                        statusCode,
                    ),
                details: [],
                args: {},
            };
        }

        if (exceptionResponse && typeof exceptionResponse === 'object') {
            const response =
                exceptionResponse as {
                    code?: string;
                    message?:
                        | string
                        | string[];
                    details?: unknown[];
                    args?: Record<string, unknown>;
                };

            if (Array.isArray(response.message)) {
                return {
                    code:
                        'VALIDATION_ERROR',
                    details:
                        response.details ??
                        response.message.map(
                            (message) => ({
                                message,
                            }),
                        ),
                    args: {},
                };
            }

            return {
                code:
                    response.code ?? this.getErrorCode(statusCode),
                details:
                    response.details ?? [],
                args:
                    response.args ?? {},
            };
        }

        return {
            code: 'INTERNAL_SERVER_ERROR',
            details: [],
            args: {},
        };
    }

    private getErrorCode(
        statusCode: number,
    ): string {
        switch (statusCode) {
            case HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';

            case HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';

            case HttpStatus.BAD_GATEWAY:
                return 'BAD_GATEWAY';

            case HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';

            case HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';

            case HttpStatus.CONFLICT:
                return 'CONFLICT';

            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }
}