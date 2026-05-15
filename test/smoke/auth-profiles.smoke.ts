import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('auth-profiles');

(SKIP ? describe.skip : describe)('smoke: auth-profiles', () => {
  it('auth-profiles get returns profile info', async () => {
    const res = await runCli(['auth-profiles', 'get', fx.portalID]);
    expect(res.exitCode).toBe(0);
  });

  it('auth-profiles revoke-tokens --help does not crash', async () => {
    // revoke-tokens is destructive; just verify the command loads
    const res = await runCli(['auth-profiles', 'revoke-tokens', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
