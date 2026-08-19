import {Module} from '@nestjs/common';
import {UsersService} from './users.service';
import {UsersController} from './users.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";

@Module({
    providers: [UsersService],
    controllers: [UsersController],
    imports: [PrismaModule, StorageModule],
    exports: [UsersService]
})
export class UsersModule {
}
