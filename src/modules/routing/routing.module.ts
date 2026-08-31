import {Module} from '@nestjs/common';
import {RoutingService} from './routing.service';
import {HttpModule} from "@nestjs/axios";

@Module({
    providers: [RoutingService],
    exports: [RoutingService],
    imports: [HttpModule],
})
export class RoutingModule {
}
