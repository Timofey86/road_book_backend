import {Module} from '@nestjs/common';
import {CommentsService} from './comments.service';
import {CommentsController} from './comments.controller';
import {CommentsRepository} from "./repositories/comments.repository";
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";
import {CommentsMapper} from "./mappers/comment.mapper";

@Module({
    providers: [
        CommentsService,
        CommentsRepository,
        CommentsMapper
    ],
    controllers: [CommentsController],
    imports: [
        PrismaModule,
        StorageModule
    ]
})
export class CommentsModule {}
