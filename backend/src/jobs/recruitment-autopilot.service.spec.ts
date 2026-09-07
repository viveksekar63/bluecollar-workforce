import { RecruitmentAutopilotService } from './recruitment-autopilot.service';

const prisma = {
  job: { findFirst: jest.fn() },
  $queryRaw: jest.fn(),
};
const jobsService = { getEmployer: jest.fn() };

describe('RecruitmentAutopilotService', () => {
  let service: RecruitmentAutopilotService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecruitmentAutopilotService(prisma as any, jobsService as any);
    jobsService.getEmployer.mockResolvedValue({ id: 'employer-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'PUBLISHED' });
  });

  it('prioritizes a strong uncontacted candidate for contact now', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        workerId: 'worker-1', matchScore: 92, matchTier: 'BEST_MATCH', status: 'NOT_CONTACTED', contactAttempts: 0,
        lastContactedAt: null, nextFollowUpAt: null, outcome: null, workerCode: 'W001', profession: 'Electrician',
        experienceYears: 5, verificationStatus: 'VERIFIED', verificationScore: 95, firstName: 'Ravi', lastName: 'K',
        phone: '+919999999999', email: 'ravi@example.com',
      },
    ]);

    const result = await service.recommendations('user-1', 'job-1', 20);
    expect(result.recommendations[0]).toMatchObject({ workerId: 'worker-1', action: 'CONTACT_NOW' });
    expect(result.summary.contactNow).toBe(1);
  });

  it('prioritizes an overdue follow-up above ordinary candidates', async () => {
    const overdue = new Date(Date.now() - 60_000);
    prisma.$queryRaw.mockResolvedValue([
      {
        workerId: 'worker-1', matchScore: 75, matchTier: 'STRONG_MATCH', status: 'CONTACTED', contactAttempts: 1,
        lastContactedAt: new Date(Date.now() - 86_400_000), nextFollowUpAt: overdue, outcome: null, workerCode: 'W001', profession: 'Electrician',
        experienceYears: 4, verificationStatus: 'VERIFIED', verificationScore: 80, firstName: 'Ravi', lastName: 'K', phone: '+919999999999', email: 'ravi@example.com',
      },
      {
        workerId: 'worker-2', matchScore: 80, matchTier: 'STRONG_MATCH', status: 'NOT_CONTACTED', contactAttempts: 0,
        lastContactedAt: null, nextFollowUpAt: null, outcome: null, workerCode: 'W002', profession: 'Electrician',
        experienceYears: 3, verificationStatus: 'VERIFIED', verificationScore: 80, firstName: 'Suresh', lastName: 'P', phone: '+918888888888', email: 'suresh@example.com',
      },
    ]);

    const result = await service.recommendations('user-1', 'job-1', 20);
    expect(result.recommendations[0]).toMatchObject({ workerId: 'worker-1', action: 'FOLLOW_UP_NOW' });
  });

  it('stops contact for terminal outcomes', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        workerId: 'worker-1', matchScore: 95, matchTier: 'BEST_MATCH', status: 'HIRED', contactAttempts: 4,
        lastContactedAt: new Date(), nextFollowUpAt: null, outcome: 'Selected', workerCode: 'W001', profession: 'Electrician',
        experienceYears: 6, verificationStatus: 'VERIFIED', verificationScore: 95, firstName: 'Ravi', lastName: 'K', phone: '+919999999999', email: 'ravi@example.com',
      },
    ]);

    const result = await service.nextAction('user-1', 'job-1');
    expect(result.nextAction).toBeNull();
  });
});
