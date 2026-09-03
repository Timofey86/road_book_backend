import {Module} from '@nestjs/common';
import {FavoritesController} from './favorites.controller';
import {FavoritesService} from './favorites.service';
import {FavoritesRepository} from "./repositories/favorites.repository";
import {PrismaModule} from "../../prisma/prisma.module";
import {RoutesModule} from "../routes/routes.module";

@Module({
    controllers: [FavoritesController],
    providers: [
        FavoritesService,
        FavoritesRepository,
    ],
    imports: [
        PrismaModule,
        RoutesModule
    ]
})
export class FavoritesModule {
}
