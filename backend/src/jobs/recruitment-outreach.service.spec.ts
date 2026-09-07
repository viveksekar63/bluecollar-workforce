import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RecruitmentOutreachService } from './recruitment-outreach.service';

const prisma = {
  job: { findFirst: jest.fn() },
  worker: { findUnique: jest.fn() },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};
const jobsService = { getEmployer: jest.fn() };

describe('RecruitmentOutreachService', () => {
  let service: RecruitmentOutreachService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecruitmentOutreachService(prisma as any, jobsService as any);
    jobsService.getEmployer.mockResolvedValue({ id: 'employer-1', status: 'VERIFIED' });
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'PUBLISHED', employerId: 'employer-1' });
  });

  it('initializes outreach only for shortlisted or invited workers', async () => {
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'action-1' }]).mockResolvedValueOnce([{ outreachId: 'outreach-1', status: 'NOT_CONTACTED', preferredChannel: 'PHONE' }]);
    await expect(service.initialize('user-1', 'job-1', 'worker-1', 'PHONE')).resolves.toMatchObject({ success: true, outreachId: 'outreach-1', workerId: 'worker-1' });
  });

  it('rejects invalid contact channels', async () => {
    await expect(service.logContact('user-1', 'job-1', 'worker-1', { channel: 'FAX' as any })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs a phone contact and creates a timeline event', async () => {
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'action-1' }]).mockResolvedValueOnce([{ id: 'outreach-1' }]).mockResolvedValueOnce([{ outreachId: 'outreach-1', status: 'INTERESTED', contactAttempts: 1 }]);
    prisma.$executeRaw.mockResolvedValue(1);
    await expect(service.logContact('user-1', 'job-1', 'worker-1', { channel: 'PHONE', status: 'INTERESTED', notes: 'Interested and available Monday' })).resolves.toMatchObject({ success: true, outreachId: 'outreach-1', status: 'INTERESTED', eventId: expect.any(String) });
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('returns the worker contact timeline', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ outreachId: 'outreach-1', status: 'CONTACTED', phone: '+919999999999', email: 'ravi@example.com' }]).mockResolvedValueOnce([{ eventId: 'event-1', channel: 'PHONE', eventType: 'CONTACT_ATTEMPT' }]);
    await expect(service.timeline('user-1', 'job-1', 'worker-1')).resolves.toMatchObject({ outreachId: 'outreach-1', phone: '+919999999999', email: 'ravi@example.com', events: [{ eventId: 'event-1' }] });
  });

  it('rejects a worker that does not exist', async () => {
    prisma.worker.findUnique.mockResolvedValue(null);
    await expect(service.initialize('user-1', 'job-1', 'missing', 'PHONE')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists due follow-ups with pagination', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ workerId: 'worker-1', status: 'INTERESTED', nextFollowUpAt: new Date() }]).mockResolvedValueOnce([{ total: BigInt(1) }]);
    await expect(service.listFollowUps('user-1', 'job-1', 1, 20)).resolves.toMatchObject({ pagination: { total: 1, page: 1, limit: 20 }, items: [{ workerId: 'worker-1' }] });
  });

  it('updates candidate status and records a timeline event', async () => {
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'action-1' }]).mockResolvedValueOnce([{ id: 'outreach-1', status: 'CONTACTED', lastChannel: 'PHONE' }]).mockResolvedValueOnce([{ outreachId: 'outreach-1', status: 'INTERESTED', nextFollowUpAt: null }]);
    prisma.$executeRaw.mockResolvedValue(1);
    await expect(service.updateStatus('user-1', 'job-1', 'worker-1', { status: 'INTERESTED', notes: 'Wants interview' })).resolves.toMatchObject({ success: true, previousStatus: 'CONTACTED', status: 'INTERESTED', terminal: false });
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });

  it('schedules a future follow-up', async () => {
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'action-1' }]).mockResolvedValueOnce([{ id: 'outreach-1', status: 'INTERESTED', lastChannel: 'PHONE' }]).mockResolvedValueOnce([{ outreachId: 'outreach-1', status: 'INTERESTED', nextFollowUpAt: '2030-01-01T10:00:00.000Z' }]);
    prisma.$executeRaw.mockResolvedValue(1);
    await expect(service.scheduleFollowUp('user-1', 'job-1', 'worker-1', '2030-01-01T10:00:00.000Z', 'Call again')).resolves.toMatchObject({ success: true, outreachId: 'outreach-1' });
  });

  it('rejects follow-up scheduling in the past', async () => {
    await expect(service.scheduleFollowUp('user-1', 'job-1', 'worker-1', '2020-01-01T10:00:00.000Z')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects follow-up for terminal status', async () => {
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'action-1' }]).mockResolvedValueOnce([{ id: 'outreach-1', status: 'HIRED', lastChannel: 'PHONE' }]);
    await expect(service.scheduleFollowUp('user-1', 'job-1', 'worker-1', '2030-01-01T10:00:00.000Z')).rejects.toBeInstanceOf(BadRequestException);
  });
});
