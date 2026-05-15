import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('recents');

(SKIP ? describe.skip : describe)('smoke: recents', () => {
  it('recents list returns recent items', async () => {
    const res = await runCli(['recents', 'list']);
    expect(res.exitCode).toBe(0);
  });

  it('recents update adds/updates a recent item', async () => {
    const res = await runCli([
      'recents', 'update',
      '--label', fx.caseTypeID,
      '--id', fx.caseTypeID,
    ]);
    expect(res.exitCode).toBe(0);
  });
});
