import { Module } from '@nestjs/common';
import {PlacesController} from "./places.controller";
import {PlacesService} from "./places.service";
import {HttpModule} from "@nestjs/axios";

@Module({
    controllers: [PlacesController],
    providers: [PlacesService],
    imports: [HttpModule],
})
export class PlacesModule {}
