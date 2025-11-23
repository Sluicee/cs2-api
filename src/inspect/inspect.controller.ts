import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common';
import { InspectService } from './inspect.service';
import { BatchInspectDto } from './inspect.dto';

@Controller('api/v1/inspect')
export class InspectController {
    constructor(private readonly inspectService: InspectService) { }

    @Get()
    async inspect(
        @Query('link') link?: string,
        @Query('s') s?: string,
        @Query('a') a?: string,
        @Query('d') d?: string,
        @Query('m') m?: string,
    ) {
        if (link) {
            const params = this.inspectService.parseInspectLink(link);
            return this.inspectService.inspectItem(params);
        }

        if (a && d && (s || m)) {
            return this.inspectService.inspectItem({ s, a, d, m });
        }

        throw new BadRequestException(
            'Either "link" OR ("a", "d", and "s"|"m") parameters are required',
        );
    }

    @Post('batch')
    async inspectBatch(@Body() body: BatchInspectDto) {
        return this.inspectService.inspectBatch(body.items);
    }

    @Get('stats')
    async getStats() {
        return this.inspectService.getStats();
    }
}
