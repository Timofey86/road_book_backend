import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {PrismaModule} from "./prisma/prisma.module";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import {ConfigModule} from "@nestjs/config";
import { StorageModule } from './modules/storage/storage.module';
import { RoutesModule } from './modules/routes/routes.module';

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
      }),
      PrismaModule,
      UsersModule,
      AuthModule,
      StorageModule,
      RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
