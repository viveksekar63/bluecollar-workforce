import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AiController } from '../src/ai/ai.controller';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RequirementParserService } from '../src/ai/requirement-parser.service';
import { JobRequirementService } from '../src/ai/job-requirement.service';
import { WorkerSearchService } from '../src/ai/worker-search.service';
import { AiJobRequirementPersistenceService } from '../src/ai/ai-job-requirement-persistence.service';
import { JobWorkerSearchService } from '../src/ai/job-worker-search.service';

describe('AI Job Find Workers (e2e)', () => {
  let app: INestApplication;
  const jobWorkerSearchService = { findWorkers: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: RequirementParserService, useValue: { parse: jest.fn() } },
        { provide: JobRequirementService, useValue: { parse: jest.fn() } },
        { provide: WorkerSearchService, useValue: { search: jest.fn() } },
        { provide: AiJobRequirementPersistenceService, useValue: { createDraft: jest.fn() } },
        { provide: JobWorkerSearchService, useValue: jobWorkerSearchService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { userId: 'employer-user-1' };
      next();
    });
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/ai/jobs/:jobId/find-workers returns ranked candidates', async () => {
    jobWorkerSearchService.findWorkers.mockResolvedValue({
      job: { id: 'job-1', title: '5 Electricians Required', status: 'DRAFT', city: 'Chennai', state: 'Tamil Nadu', openings: 5 },
      aiRequirements: { minimumExperienceYears: 5, minimumSkillLevel: 'EXPERT', languages: [{ id: 'lang-1', name: 'Tamil' }] },
      status: 'MATCHED',
      results: {
        items: [{ id: 'worker-1', matchScore: 100, preferenceScore: 0 }],
        page: 1,
        limit: 5,
        total: 1,
        totalPages: 1,
        candidateTotal: 1,
        rankingCandidateLimit: 1,
        hasNext: false,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/ai/jobs/job-1/find-workers')
      .send({ page: 1, limit: 5 })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.job.id).toBe('job-1');
    expect(response.body.results.items[0].matchScore).toBe(100);
    expect(jobWorkerSearchService.findWorkers).toHaveBeenCalledWith('employer-user-1', 'job-1', { page: 1, limit: 5 });
  });
});
