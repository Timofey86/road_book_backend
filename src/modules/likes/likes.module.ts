import {Module} from '@nestjs/common';
import {LikesService} from './likes.service';
import {LikesController} from './likes.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {LikesRepository} from "./repositories/likes.repository";

@Module({
    providers: [
        LikesService,
        LikesRepository
    ],
    controllers: [LikesController],
    imports: [PrismaModule]
})
export class LikesModule {
}
