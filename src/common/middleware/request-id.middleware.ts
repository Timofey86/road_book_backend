import {Injectable, NestMiddleware} from "@nestjs/common";
import {
    NextFunction,
    Request,
    Response,
} from "express";
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(
        request: Request,
        response: Response,
        next: NextFunction,
    ): void {
        const requestId =
            request.header('x-request-id') ?? randomUUID();

        request.requestId = requestId;

        response.setHeader(
            'x-request-id',
            requestId,
        );

        next();
    }
}