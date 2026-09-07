import { AiWorkerActionsController } from './ai-worker-actions.controller';

describe('AiWorkerActionsController', () => {
  const actions = {
    shortlist: jest.fn(), listShortlisted: jest.fn(), removeShortlist: jest.fn(), invite: jest.fn(), listInvitationsForEmployer: jest.fn(),
  };
  const controller = new AiWorkerActionsController(actions as any);
  beforeEach(() => jest.clearAllMocks());

  it('passes shortlist requests to the action service', async () => {
    actions.shortlist.mockResolvedValue({ success: true, action: 'SHORTLISTED' });
    const dto = { matchScore: 95, matchTier: 'BEST_MATCH', matchExplanation: { recommendation: 'Excellent fit' } };
    await expect(controller.shortlist({ userId: 'user-1' }, 'job-1', 'worker-1', dto as any)).resolves.toEqual({ success: true, action: 'SHORTLISTED' });
    expect(actions.shortlist).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', dto);
  });

  it('passes pagination to shortlisted workers', async () => {
    actions.listShortlisted.mockResolvedValue({ items: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 } });
    await controller.shortlistedWorkers({ userId: 'user-1' }, 'job-1', 2, 10);
    expect(actions.listShortlisted).toHaveBeenCalledWith('user-1', 'job-1', 2, 10);
  });

  it('passes remove-shortlist requests through', async () => {
    actions.removeShortlist.mockResolvedValue({ success: true, action: 'SHORTLIST_REMOVED' });
    await controller.removeShortlist({ userId: 'user-1' }, 'job-1', 'worker-1');
    expect(actions.removeShortlist).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1');
  });

  it('passes invite requests through', async () => {
    actions.invite.mockResolvedValue({ success: true, action: 'INVITED' });
    const dto = { matchScore: 88, matchTier: 'STRONG_MATCH' };
    await controller.invite({ userId: 'user-1' }, 'job-1', 'worker-1', dto as any);
    expect(actions.invite).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', dto);
  });

  it('passes employer invitation listing through', async () => {
    actions.listInvitationsForEmployer.mockResolvedValue({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await controller.invitations({ userId: 'user-1' }, 'job-1', 1, 20);
    expect(actions.listInvitationsForEmployer).toHaveBeenCalledWith('user-1', 'job-1', 1, 20);
  });
});
