import { RecruitmentAutopilotController } from './recruitment-autopilot.controller';

describe('RecruitmentAutopilotController', () => {
  const autopilot = { recommendations: jest.fn(), conversionRecommendations: jest.fn(), nextAction: jest.fn(), dashboard: jest.fn() };
  const controller = new RecruitmentAutopilotController(autopilot as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns ranked recruitment recommendations', async () => {
    await controller.recommendations({ userId: 'user-1' }, 'job-1', 10);
    expect(autopilot.recommendations).toHaveBeenCalledWith('user-1', 'job-1', 10);
  });

  it('returns conversion recommendations', async () => {
    await controller.conversionRecommendations({ userId: 'user-1' }, 'job-1', 10);
    expect(autopilot.conversionRecommendations).toHaveBeenCalledWith('user-1', 'job-1', 10);
  });

  it('returns the next recommended recruitment action', async () => {
    await controller.nextAction({ userId: 'user-1' }, 'job-1');
    expect(autopilot.nextAction).toHaveBeenCalledWith('user-1', 'job-1');
  });

  it('returns the AI recruitment dashboard', async () => {
    await controller.dashboard({ userId: 'user-1' }, 'job-1');
    expect(autopilot.dashboard).toHaveBeenCalledWith('user-1', 'job-1');
  });
});
