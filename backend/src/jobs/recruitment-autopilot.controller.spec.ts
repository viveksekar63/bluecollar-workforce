import { RecruitmentAutopilotController } from './recruitment-autopilot.controller';

describe('RecruitmentAutopilotController', () => {
  const autopilot = { recommendations: jest.fn(), nextAction: jest.fn() };
  const controller = new RecruitmentAutopilotController(autopilot as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns ranked recruitment recommendations', async () => {
    await controller.recommendations({ userId: 'user-1' }, 'job-1', 10);
    expect(autopilot.recommendations).toHaveBeenCalledWith('user-1', 'job-1', 10);
  });

  it('returns the next recommended recruitment action', async () => {
    await controller.nextAction({ userId: 'user-1' }, 'job-1');
    expect(autopilot.nextAction).toHaveBeenCalledWith('user-1', 'job-1');
  });
});
