import { Module } from '@nestjs/common';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionSyncService } from './subscription-sync.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionSyncService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
