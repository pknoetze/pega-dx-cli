import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('documents');

(SKIP ? describe.skip : describe)('smoke: documents', () => {
  it('documents get returns document metadata', async () => {
    const res = await runCli(['documents', 'get', fx.documentID]);
    expect(res.exitCode).toBe(0);
  });

  it('documents delete --help does not crash', async () => {
    // documents delete requires a caseId + --document flag — verify the command loads
    const res = await runCli(['documents', 'delete', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
