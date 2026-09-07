import { RecruitmentOutreachController } from './recruitment-outreach.controller';

describe('RecruitmentOutreachController', () => {
  const outreach = { list: jest.fn(), initialize: jest.fn(), logContact: jest.fn(), timeline: jest.fn() };
  const controller = new RecruitmentOutreachController(outreach as any);

  beforeEach(() => jest.clearAllMocks());

  it('passes contact list filters', async () => {
    outreach.list.mockResolvedValue({ items: [] });
    await controller.list({ userId: 'user-1' }, 'job-1', 2, 10, 'NOT_CONTACTED');
    expect(outreach.list).toHaveBeenCalledWith('user-1', 'job-1', 2, 10, 'NOT_CONTACTED');
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

  it('returns outreach timeline', async () => {
    await controller.timeline({ userId: 'user-1' }, 'job-1', 'worker-1');
    expect(outreach.timeline).toHaveBeenCalledWith('user-1', 'job-1', 'worker-1');
  });
});
