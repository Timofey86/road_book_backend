import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {PrismaModule} from "./prisma/prisma.module";
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import {ConfigModule} from "@nestjs/config";
import { StorageModule } from './modules/storage/storage.module';
import { RoutesModule } from './modules/routes/routes.module';
import { RouteStopsModule } from './modules/route-stops/route-stops.module';
import { PlacesModule } from './modules/places/places.module';
import {HttpModule} from "@nestjs/axios";
import { RoutingModule } from './modules/routing/routing.module';
import { TagsModule } from './modules/tags/tags.module';

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
      RouteStopsModule,
      PlacesModule,
      HttpModule,
      RoutingModule,
      TagsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
