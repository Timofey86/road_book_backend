import {Module} from '@nestjs/common';
import {UsersService} from './users.service';
import {UsersController} from './users.controller';
import {PrismaModule} from "../../prisma/prisma.module";
import {StorageModule} from "../storage/storage.module";
import {UsersRepository} from "./repositories/user.repository";
import {UserMapper} from "./mappers/user.mapper";

@Module({
    providers: [
        UsersService,
        UsersRepository,
        UserMapper
    ],
    controllers: [UsersController],
    imports: [PrismaModule, StorageModule],
    exports: [UsersService]
})
export class UsersModule {
}
