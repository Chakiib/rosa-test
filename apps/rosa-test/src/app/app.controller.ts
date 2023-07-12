import { Body, Controller, Post } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Post('/availabilities')
    getAvailabilities(@Body() body: { from: Date; to: Date }) {
        return this.appService.getAvailabilities(body.from, body.to);
    }

    @Post('/next')
    getNextAvailability(@Body() body: { from: Date }) {
        return this.appService.getNextAvailability(body.from);
    }
}
