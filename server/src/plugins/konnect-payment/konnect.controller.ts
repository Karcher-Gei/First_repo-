import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import { KonnectService } from './konnect.service';

/** Konnect calls GET /konnect/webhook?payment_ref=... once a payment attempt ends. */
@Controller('konnect')
export class KonnectController {
    constructor(private readonly konnectService: KonnectService) {}

    @Get('webhook')
    async webhook(@Query('payment_ref') paymentRef: string | undefined): Promise<{ ok: true }> {
        if (!paymentRef) {
            throw new BadRequestException('payment_ref is required');
        }
        await this.konnectService.handleWebhook(paymentRef);
        return { ok: true };
    }
}
