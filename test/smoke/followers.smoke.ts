import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('followers');

(SKIP ? describe.skip : describe)('smoke: followers', () => {
  let caseId: string | undefined;
  /** The operator ID of the profile we logged in as; resolved from auth ping output */
  let operatorId: string | undefined;

  beforeAll(async () => {
    const caseRes = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (caseRes.exitCode === 0) {
      caseId = JSON.parse(caseRes.stdout).ID;
    }
    // Resolve the current user's operator ID via auth ping
    const pingRes = await runCli(['auth', 'ping']);
    if (pingRes.exitCode === 0) {
      try {
        operatorId = JSON.parse(pingRes.stdout).operatorID ?? JSON.parse(pingRes.stdout).userID;
      } catch {
        // stdout is plain text; leave operatorId undefined
      }
    }
  });

  it('followers list lists followers on a case', async () => {
    if (!caseId) return;
    const res = await runCli(['followers', 'list', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('followers add adds a follower to a case', async () => {
    if (!caseId || !operatorId) return;
    const res = await runCli([
      'followers', 'add', caseId,
      '--user', operatorId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('followers delete removes a follower from a case', async () => {
    if (!caseId || !operatorId) return;
    const res = await runCli([
      'followers', 'delete', caseId,
      '--user', operatorId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  afterAll(async () => {
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
