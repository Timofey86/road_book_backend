import {Observable} from "rxjs";
import {JwtUser} from "../../common/interfaces/jwt-user.interface";
import {
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NestInterceptor
} from "@nestjs/common";
import { tap } from 'rxjs/operators';
import type {Request, Response} from 'express';
import {ConfigService} from "@nestjs/config";

type AuthenticatedRequest = Request & {
    user?: JwtUser;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    constructor(
        private readonly configService: ConfigService,
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<unknown> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<AuthenticatedRequest>();
        const response = httpContext.getResponse<Response>();
        const startedAt = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    this.logRequest(
                        request,
                        response.statusCode,
                        startedAt,
                    );
                },
                error: (error: unknown) => {
                    const statusCode =
                        error instanceof HttpException
                            ? error.getStatus()
                            : HttpStatus.INTERNAL_SERVER_ERROR;

                    this.logRequest(
                        request,
                        statusCode,
                        startedAt,
                    );
                },
            })
        )
    }

    private logRequest(
        request: AuthenticatedRequest,
        statusCode: number,
        startedAt: number,
    ): void {
        this.logger.log(
            JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'roadbook-api',
                environment:
                    this.configService.get<string>('NODE_ENV') ??
                    'development',
                requestId: request.requestId,
                method: request.method,
                path: request.originalUrl,
                statusCode,
                durationMs: Date.now() - startedAt,
                userId: request.user?.id ?? null,
                ip: request.ip,
                userAgent: request.get('user-agent') ?? null,
                message: 'HTTP request completed',
            }),
        );
    }
}
