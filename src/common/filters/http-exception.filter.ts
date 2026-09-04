import {ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus} from "@nestjs/common";
import type {
    Request,
    Response,
} from 'express';

@Catch()
export class HttpExceptionFilter
    implements ExceptionFilter
{
    catch(
        exception: unknown,
        host: ArgumentsHost,
    ): void {
        const context = host.switchToHttp();

        const response =
            context.getResponse<Response>();

        const request =
            context.getRequest<Request>();

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
            message,
            details,
        } = this.buildErrorResponse(
            statusCode,
            exceptionResponse,
        );

        response.status(statusCode).json({
            statusCode,
            code,
            message,
            details,
            requestId: request.requestId,
            timestamp: new Date().toISOString(),
            path: request.originalUrl,
        });
    }

    private buildErrorResponse(
        statusCode: number,
        exceptionResponse: string | object | null,
    ): {
        code: string;
        message: string;
        details: unknown[];
    } {
        if (typeof exceptionResponse === 'string') {
            return {
                code: this.getErrorCode(statusCode),
                message: exceptionResponse,
                details: [],
            };
        }

        if (
            exceptionResponse &&
            typeof exceptionResponse === 'object'
        ) {
            const response = exceptionResponse as {
                code?: string;
                message?: string | string[];
                error?: string;
                details?: unknown[];
            };

            if (Array.isArray(response.message)) {
                return {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: response.message.map(
                        (message) => ({
                            message,
                        }),
                    ),
                };
            }

            return {
                code:
                    response.code ??
                    this.getErrorCode(statusCode),

                message:
                    response.message ??
                    response.error ??
                    'Request failed',

                details:
                    response.details ?? [],
            };
        }

        return {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
            details: [],
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