import {Module} from '@nestjs/common';
import {RoutesService} from './routes.service';
import {RoutesController} from './routes.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";
import {RoutingModule} from "../routing/routing.module";

@Module({
    providers: [RoutesService],
    controllers: [RoutesController],
    imports: [
        PrismaModule,
        StorageModule,
        RoutingModule
    ],
    exports: [RoutesService]
})
export class RoutesModule {
}
