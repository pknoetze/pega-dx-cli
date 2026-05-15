import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('assignments');

/**
 * Assignments are work items that exist on a live case.
 * We bootstrap a case first, then resolve the first assignment from it.
 */
(SKIP ? describe.skip : describe)('smoke: assignments', () => {
  let caseId: string | undefined;
  let assignmentId: string | undefined;
  let actionId: string | undefined;

  beforeAll(async () => {
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (res.exitCode === 0) {
      const parsed = JSON.parse(res.stdout);
      caseId = parsed.ID;
      // The create response includes nextAssignmentInfo
      assignmentId = parsed.nextAssignmentInfo?.ID ?? parsed.assignments?.[0]?.ID;
      actionId = parsed.nextAssignmentInfo?.actions?.[0]?.ID ?? parsed.assignments?.[0]?.actions?.[0]?.ID;
    }
  });

  it('assignments get-next returns the work queue', async () => {
    const res = await runCli(['assignments', 'get-next']);
    expect(res.exitCode).toBe(0);
  });

  it('assignments get returns an assignment', async () => {
    if (!assignmentId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli(['assignments', 'get', assignmentId]);
    expect(res.exitCode).toBe(0);
  });

  it('assignments get-action returns an action form', async () => {
    if (!assignmentId || !actionId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'assignments', 'get-action', assignmentId,
      '--action', actionId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assignments refresh-action refreshes an action form', async () => {
    if (!assignmentId || !actionId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'assignments', 'refresh-action', assignmentId,
      '--action', actionId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assignments save saves an assignment', async () => {
    if (!assignmentId || !actionId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'assignments', 'save', assignmentId,
      '--action', actionId,
      '--data', '{}',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assignments navigate-to-step navigates to a step', async () => {
    if (!assignmentId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'assignments', 'navigate-to-step', assignmentId,
      '--step', 'pyStartAssignment',
    ]);
    // May return non-zero if step not found; check only that it does not crash
    expect([0, 1]).toContain(res.exitCode);
  });

  it('assignments navigate-back navigates back', async () => {
    if (!assignmentId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli(['assignments', 'navigate-back', assignmentId]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('assignments perform completes an assignment action', async () => {
    if (!assignmentId || !actionId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'assignments', 'perform', assignmentId,
      '--action', actionId,
      '--data', '{}',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assignments recalculate recalculates fields', async () => {
    if (!assignmentId || !actionId) throw new Error('precondition: case bootstrap must succeed first');
    const body = JSON.stringify({ calculations: { fields: [] } });
    const res = await runCli([
      'assignments', 'recalculate', assignmentId,
      '--action', actionId,
      '--data', body,
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  afterAll(async () => {
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
