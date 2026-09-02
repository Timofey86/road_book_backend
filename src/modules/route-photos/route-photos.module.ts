import {Module} from '@nestjs/common';
import {RoutePhotosController} from './route-photos.controller';
import {RoutePhotosService} from './route-photos.service';
import {PrismaModule} from "../../prisma/prisma.module";
import {RoutePhotosRepository} from "./repositories/route-photos.repositories";
import {StorageModule} from "../storage/storage.module";
import {RoutePhotosMapper} from "./mappers/route-photos.mapper";

@Module({
    controllers: [RoutePhotosController],
    providers: [
        RoutePhotosService,
        RoutePhotosRepository,
        RoutePhotosMapper
    ],
    imports: [PrismaModule, StorageModule],
    exports: [RoutePhotosMapper]
})
export class RoutePhotosModule {
}
