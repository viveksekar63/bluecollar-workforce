import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiWorkerActionsService } from './ai-worker-actions.service';

const prisma = {
  worker: { findUnique: jest.fn() },
  job: { findFirst: jest.fn() },
  $queryRaw: jest.fn(),
  $executeRaw: jest.fn(),
};
const jobsService = { getEmployer: jest.fn() };
const notifications = { create: jest.fn() };

describe('AiWorkerActionsService', () => {
  let service: AiWorkerActionsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiWorkerActionsService(prisma as any, jobsService as any, notifications as any);
    jobsService.getEmployer.mockResolvedValue({ id: 'employer-1', status: 'VERIFIED' });
    notifications.create.mockResolvedValue({ id: 'notification-1' });
  });

  it('shortlists a verified employer-owned job and snapshots the AI match', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'PUBLISHED' });
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });
    prisma.$queryRaw.mockResolvedValue([{ id: 'action-1', created_at: new Date('2026-09-07T10:00:00Z') }]);
    const result = await service.shortlist('user-1', 'job-1', 'worker-1', { matchScore: 94, matchTier: 'BEST_MATCH', matchExplanation: { recommendation: 'Excellent fit' } });
    expect(result).toMatchObject({ success: true, action: 'SHORTLISTED', actionId: 'action-1', matchScore: 94, matchTier: 'BEST_MATCH' });
  });

  it('rejects shortlist for a job not owned by the employer', async () => {
    prisma.job.findFirst.mockResolvedValue(null);
    await expect(service.shortlist('user-1', 'job-1', 'worker-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid match score', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'PUBLISHED' });
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });
    await expect(service.shortlist('user-1', 'job-1', 'worker-1', { matchScore: 101 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists shortlisted workers with pagination', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1' });
    prisma.$queryRaw.mockResolvedValueOnce([{ workerId: 'worker-1', matchScore: 92 }]).mockResolvedValueOnce([{ total: BigInt(3) }]);
    const result = await service.listShortlisted('user-1', 'job-1', 2, 1);
    expect(result.pagination).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
    expect(result.items).toHaveLength(1);
  });

  it('removes an existing shortlist', async () => {
    prisma.$executeRaw.mockResolvedValue(1);
    await expect(service.removeShortlist('user-1', 'job-1', 'worker-1')).resolves.toEqual({ success: true, action: 'SHORTLIST_REMOVED', jobId: 'job-1', workerId: 'worker-1' });
  });

  it('returns not found when removing a missing shortlist', async () => {
    prisma.$executeRaw.mockResolvedValue(0);
    await expect(service.removeShortlist('user-1', 'job-1', 'worker-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('invites a worker and creates a worker notification', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'PUBLISHED' });
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });
    prisma.$queryRaw.mockResolvedValue([{ id: 'invite-1', invited_at: new Date('2026-09-07T11:00:00Z') }]);
    const result = await service.invite('user-1', 'job-1', 'worker-1', { matchScore: 88, matchTier: 'STRONG_MATCH' });
    expect(result).toMatchObject({ success: true, action: 'INVITED', actionId: 'invite-1', matchScore: 88 });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'worker-user-1', type: 'JOB', data: expect.objectContaining({ invitationId: 'invite-1', jobId: 'job-1' }) }));
  });

  it('rejects invitations for non-published jobs', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'job-1', title: 'Electrician', status: 'DRAFT' });
    await expect(service.invite('user-1', 'job-1', 'worker-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
