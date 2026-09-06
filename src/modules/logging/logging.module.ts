import { Module } from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {HttpLoggingInterceptor} from "./http-logging.interceptor";

@Module({
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpLoggingInterceptor,
        },
    ],
})
export class LoggingModule {}
