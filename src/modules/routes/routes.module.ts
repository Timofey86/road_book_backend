import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import {PrismaModule} from "../../prisma/prisma.module";

@Module({
  providers: [RoutesService],
  controllers: [RoutesController],
    imports: [PrismaModule],
  exports: [RoutesService]
})
export class RoutesModule {}
