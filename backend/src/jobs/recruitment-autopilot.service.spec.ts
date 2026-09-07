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
        phone: '+919999999999', email: 'ravi@example.com', positiveEvents: 0, noResponseEvents: 0,
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
        positiveEvents: 0, noResponseEvents: 0,
      },
      {
        workerId: 'worker-2', matchScore: 80, matchTier: 'STRONG_MATCH', status: 'NOT_CONTACTED', contactAttempts: 0,
        lastContactedAt: null, nextFollowUpAt: null, outcome: null, workerCode: 'W002', profession: 'Electrician',
        experienceYears: 3, verificationStatus: 'VERIFIED', verificationScore: 80, firstName: 'Suresh', lastName: 'P', phone: '+918888888888', email: 'suresh@example.com',
        positiveEvents: 0, noResponseEvents: 0,
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
        positiveEvents: 1, noResponseEvents: 0,
      },
    ]);

    const result = await service.nextAction('user-1', 'job-1');
    expect(result.nextAction).toBeNull();
  });

  it('aggregates the recruitment dashboard funnel and action queues', async () => {
    const overdue = new Date(Date.now() - 60_000);
    prisma.$queryRaw.mockResolvedValue([
      {
        workerId: 'worker-1', matchScore: 92, matchTier: 'BEST_MATCH', status: 'NOT_CONTACTED', contactAttempts: 0,
        lastContactedAt: null, nextFollowUpAt: null, outcome: null, workerCode: 'W001', profession: 'Electrician', experienceYears: 5,
        verificationStatus: 'VERIFIED', verificationScore: 95, firstName: 'Ravi', lastName: 'K', phone: '+919999999999', email: 'ravi@example.com', positiveEvents: 0, noResponseEvents: 0,
      },
      {
        workerId: 'worker-2', matchScore: 85, matchTier: 'STRONG_MATCH', status: 'INTERESTED', contactAttempts: 1,
        lastContactedAt: new Date(), nextFollowUpAt: overdue, outcome: 'INTERESTED', workerCode: 'W002', profession: 'Electrician', experienceYears: 4,
        verificationStatus: 'VERIFIED', verificationScore: 90, firstName: 'Suresh', lastName: 'P', phone: '+918888888888', email: 'suresh@example.com', positiveEvents: 1, noResponseEvents: 0,
      },
      {
        workerId: 'worker-3', matchScore: 70, matchTier: 'GOOD_MATCH', status: 'NO_RESPONSE', contactAttempts: 3,
        lastContactedAt: new Date(), nextFollowUpAt: null, outcome: 'NO_RESPONSE', workerCode: 'W003', profession: 'Electrician', experienceYears: 3,
        verificationStatus: 'PENDING', verificationScore: 40, firstName: 'Muthu', lastName: 'R', phone: '+917777777777', email: 'muthu@example.com', positiveEvents: 0, noResponseEvents: 2,
      },
      {
        workerId: 'worker-4', matchScore: 95, matchTier: 'BEST_MATCH', status: 'HIRED', contactAttempts: 2,
        lastContactedAt: new Date(), nextFollowUpAt: null, outcome: 'HIRED', workerCode: 'W004', profession: 'Electrician', experienceYears: 7,
        verificationStatus: 'VERIFIED', verificationScore: 98, firstName: 'Kumar', lastName: 'S', phone: '+916666666666', email: 'kumar@example.com', positiveEvents: 1, noResponseEvents: 0,
      },
    ]);

    const result = await service.dashboard('user-1', 'job-1');
    expect(result.summary).toMatchObject({ totalMatchedWorkers: 4, shortlisted: 4, notContacted: 1, interested: 1, noResponse: 1, hired: 1 });
    expect(result.summary.followUpsDue).toBe(1);
    expect(result.funnel).toEqual(expect.arrayContaining([
      { stage: 'MATCHED', count: 4 },
      { stage: 'SHORTLISTED', count: 4 },
      { stage: 'INTERESTED', count: 1 },
      { stage: 'HIRED', count: 1 },
    ]));
    expect(result.followUpsDue).toHaveLength(1);
    expect(result.candidatesLosingInterest).toHaveLength(1);
  });
});
