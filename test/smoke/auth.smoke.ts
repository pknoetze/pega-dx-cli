import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('auth');

(SKIP ? describe.skip : describe)('smoke: auth', () => {
  it('auth ping returns exit 0', async () => {
    const res = await runCli(['auth', 'ping']);
    expect(res.exitCode).toBe(0);
  });

  it('auth diagnose runs without crashing', async () => {
    const res = await runCli(['auth', 'diagnose']);
    expect(res.exitCode).toBe(0);
  });

  it('auth login --help does not crash', async () => {
    const res = await runCli(['auth', 'login', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('auth refresh-b2s --help does not crash', async () => {
    const res = await runCli(['auth', 'refresh-b2s', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
