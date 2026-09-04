import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAiService } from './mock-ai.service';
import { RequirementParserService } from './requirement-parser.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    MockAiService,
    RequirementParserService,
  ],
  exports: [
    AiService,
    RequirementParserService,
  ],
})
export class AiModule {}
