import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { CreditWalletService } from '../contact-purchases/credit-wallet.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService, CreditWalletService],
  exports: [CreditsService, CreditWalletService],
})
export class CreditsModule {}
