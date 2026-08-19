import {Injectable, OnModuleInit} from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import {PrismaMariaDb} from "@prisma/adapter-mariadb";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{
    constructor() {
        const adapter = new PrismaMariaDb({
            host: process.env.MYSQL_HOST ?? 'mysql',
            port: Number(process.env.MYSQL_PORT ?? 3306),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            connectionLimit: 5,
            allowPublicKeyRetrieval: true,
        });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }
}
