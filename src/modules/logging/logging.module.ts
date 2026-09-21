import { Module } from '@nestjs/common';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {HttpLoggingInterceptor} from "./http-logging.interceptor";
import {ElasticsearchService} from "./elasticsearch.service";

@Module({
    providers: [
        ElasticsearchService,
        {
            provide: APP_INTERCEPTOR,
            useClass: HttpLoggingInterceptor,
        },
    ],
})
export class LoggingModule {}
