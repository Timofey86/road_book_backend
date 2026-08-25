import {Module} from '@nestjs/common';
import {RoutesService} from './routes.service';
import {RoutesController} from './routes.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";

@Module({
    providers: [RoutesService],
    controllers: [RoutesController],
    imports: [PrismaModule, StorageModule],
    exports: [RoutesService]
})
export class RoutesModule {
}
