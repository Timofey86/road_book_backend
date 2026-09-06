import {MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
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
import { RoutePhotosModule } from './modules/route-photos/route-photos.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import {RequestIdMiddleware} from "./common/middleware/request-id.middleware";
import {AcceptLanguageResolver, I18nModule} from "nestjs-i18n";
import { join } from 'path';
import {APP_FILTER} from "@nestjs/core";
import {HttpExceptionFilter} from "./common/filters/http-exception.filter";

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
      TagsModule,
      RoutePhotosModule,
      CommentsModule,
      LikesModule,
      FavoritesModule,
      I18nModule.forRoot({
          fallbackLanguage: 'en',
          loaderOptions: {
              path: join(__dirname, '..', 'i18n'),
              watch: true,
          },
          resolvers: [
              AcceptLanguageResolver,
          ],
      }),

  ],
  controllers: [AppController],
  providers: [AppService, {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
  },],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(RequestIdMiddleware)
            .forRoutes({
                path: '{*path}',
                method: RequestMethod.ALL,
            });
    }
}
