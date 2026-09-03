import {Module} from '@nestjs/common';
import {RoutesService} from './services/routes.service';
import {RoutesController} from './routes.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";
import {RoutingModule} from "../routing/routing.module";
import {TagsModule} from "../tags/tags.module";
import {RouteMapper} from "./mappers/route.mapper";
import {RoutesRepository} from "./repositories/routes.repository";
import {RoutesQueryService} from "./services/routes-query.service";
import {RoutePhotosModule} from "../route-photos/route-photos.module";


@Module({
    providers: [
        RoutesService,
        RouteMapper,
        RoutesRepository,
        RoutesQueryService
    ],
    controllers: [RoutesController],
    imports: [
        PrismaModule,
        StorageModule,
        RoutingModule,
        TagsModule,
        RoutePhotosModule
    ],
    exports: [
        RoutesService,
        RouteMapper
    ],
})
export class RoutesModule {
}
