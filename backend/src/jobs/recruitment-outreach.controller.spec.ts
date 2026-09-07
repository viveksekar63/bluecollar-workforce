import { RecruitmentOutreachController } from './recruitment-outreach.controller';

describe('RecruitmentOutreachController', () => {
  const outreach = { list: jest.fn(), listFollowUps: jest.fn(), initialize: jest.fn(), logContact: jest.fn(), updateStatus: jest.fn(), scheduleFollowUp: jest.fn(), timeline: jest.fn() };
  const controller = new RecruitmentOutreachController(outreach as any);

  beforeEach(() => jest.clearAllMocks());

  it('passes contact list filters', async () => {
    outreach.list.mockResolvedValue({ items: [] });
    await controller.list({ userId: 'user-1' }, 'job-1', 2, 10, 'NOT_CONTACTED');
    expect(outreach.list).toHaveBeenCalledWith('user-1', 'job-1', 2, 10, 'NOT_CONTACTED');
  });

  it('lists due follow-ups', async () => {
    await controller.listFollowUps({ userId: 'user-1' }, 'job-1', 1, 20);
    expect(outreach.listFollowUps).toHaveBeenCalledWith('user-1', 'job-1', 1, 20);
  });

  it('initializes a preferred outreach channel', async () => {
    await controller.initialize({ userId: 'user-1' }, 'job-1', 'worker-1', { preferredChannel: 'WHATSAPP' } as any);
    expect(outreach.initialize).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', 'WHATSAPP');
  });

  it('logs a contact outcome', async () => {
    const dto = { channel: 'PHONE', status: 'INTERESTED', notes: 'Call went well' };
    await controller.logContact({ userId: 'user-1' }, 'job-1', 'worker-1', dto as any);
    expect(outreach.logContact).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', dto);
  });

  it('updates outreach status', async () => {
    const dto = { status: 'INTERVIEW', notes: 'Interview scheduled' };
    await controller.updateStatus({ userId: 'user-1' }, 'job-1', 'worker-1', dto as any);
    expect(outreach.updateStatus).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', dto);
  });

  it('schedules a follow-up', async () => {
    const dto = { nextFollowUpAt: '2030-01-01T10:00:00.000Z', notes: 'Call tomorrow' };
    await controller.scheduleFollowUp({ userId: 'user-1' }, 'job-1', 'worker-1', dto as any);
    expect(outreach.scheduleFollowUp).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1', dto.nextFollowUpAt, dto.notes);
  });

  it('returns outreach timeline', async () => {
    await controller.timeline({ userId: 'user-1' }, 'job-1', 'worker-1');
    expect(outreach.timeline).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1');
  });
});
