import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkersModule } from '../workers/workers.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MockAiService } from './mock-ai.service';
import { RequirementParserService } from './requirement-parser.service';
import { WorkerRequirementNormalizerService } from './worker-requirement-normalizer.service';
import { JobRequirementService } from './job-requirement.service';
import { WorkerSearchService } from './worker-search.service';

@Module({
  imports: [ConfigModule, PrismaModule, WorkersModule],
  controllers: [AiController],
  providers: [
    AiService,
    MockAiService,
    RequirementParserService,
    WorkerRequirementNormalizerService,
    JobRequirementService,
    WorkerSearchService,
  ],
  exports: [
    AiService,
    RequirementParserService,
    WorkerRequirementNormalizerService,
    JobRequirementService,
    WorkerSearchService,
  ],
})
export class AiModule {}
