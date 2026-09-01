import {Module} from '@nestjs/common';
import {TagsService} from './tags.service';
import {TagsController} from './tags.controller';
import {TagsRepository} from "./repositories/tags.repository";
import {PrismaModule} from "../../prisma/prisma.module";

@Module({
    providers: [TagsService, TagsRepository],
    controllers: [TagsController],
    exports: [TagsService],
    imports: [PrismaModule]
})
export class TagsModule {
}
