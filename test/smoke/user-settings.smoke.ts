import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('user-settings');

(SKIP ? describe.skip : describe)('smoke: user-settings', () => {
  it('user-settings get returns current user settings', async () => {
    const res = await runCli(['user-settings', 'get']);
    expect(res.exitCode).toBe(0);
  });

  it('user-settings patch updates user settings', async () => {
    // Send an empty patch — valid but a no-op on most instances
    const res = await runCli([
      'user-settings', 'patch',
      '--data', '{}',
    ]);
    expect(res.exitCode).toBe(0);
  });
});
