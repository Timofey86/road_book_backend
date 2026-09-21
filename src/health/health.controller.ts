import {Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({
        summary: 'Check application health',
    })
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}