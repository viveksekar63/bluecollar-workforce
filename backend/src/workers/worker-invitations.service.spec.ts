import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkerInvitationsService } from './worker-invitations.service';

const prisma = {
  worker: { findUnique: jest.fn() },
  $queryRaw: jest.fn(),
};

describe('WorkerInvitationsService', () => {
  let service: WorkerInvitationsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkerInvitationsService(prisma as any);
    prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
  });

  it('lists invitations with pagination', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ invitationId: 'invite-1', responseStatus: 'PENDING' }]).mockResolvedValueOnce([{ total: BigInt(3) }]);
    const result = await service.list('worker-user-1', 2, 1);
    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3, hasNext: true, hasPrevious: true });
  });

  it('accepts a pending invitation belonging to the worker', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ invitationId: 'invite-1', jobId: 'job-1', workerId: 'worker-1', responseStatus: 'ACCEPTED', respondedAt: new Date() }]);
    await expect(service.respond('worker-user-1', 'invite-1', 'ACCEPT')).resolves.toMatchObject({ success: true, responseStatus: 'ACCEPTED' });
  });

  it('rejects an invalid response', async () => {
    await expect(service.respond('worker-user-1', 'invite-1', 'MAYBE' as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an already answered invitation', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'invite-1', response_status: 'ACCEPTED' }]);
    await expect(service.respond('worker-user-1', 'invite-1', 'DECLINE')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an invitation that does not belong to the worker', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(service.respond('worker-user-1', 'invite-1', 'ACCEPT')).rejects.toBeInstanceOf(NotFoundException);
  });
});
