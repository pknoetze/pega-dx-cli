import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('case-types');

(SKIP ? describe.skip : describe)('smoke: case-types', () => {
  it('case-types list returns available case types', async () => {
    const res = await runCli(['case-types', 'list']);
    expect(res.exitCode).toBe(0);
  });

  it('case-types get returns a specific case type', async () => {
    const res = await runCli(['case-types', 'get', fx.caseTypeID]);
    expect(res.exitCode).toBe(0);
  });

  it('case-types list-bulk-actions returns bulk actions for a case type', async () => {
    const res = await runCli(['case-types', 'list-bulk-actions', fx.caseTypeID]);
    expect(res.exitCode).toBe(0);
  });

  it('case-types get-action returns action form', async () => {
    // Action IDs vary by instance; use --help to verify the command loads
    const res = await runCli(['case-types', 'get-action', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
