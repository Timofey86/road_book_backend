import { Module } from '@nestjs/common';
import { RouteStopsService } from './route-stops.service';
import { RouteStopsController } from './route-stops.controller';
import {PrismaModule} from "../../prisma/prisma.module";


@Module({
  providers: [RouteStopsService],
  controllers: [RouteStopsController],
  imports: [PrismaModule]
})
export class RouteStopsModule {}
