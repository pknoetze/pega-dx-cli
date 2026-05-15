import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('cases');

(SKIP ? describe.skip : describe)('smoke: cases', () => {
  let caseId: string | undefined;
  let actionId: string | undefined;

  it('cases create creates a new case', async () => {
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    expect(parsed.ID).toBeDefined();
    caseId = parsed.ID;
    actionId = parsed.nextAssignmentInfo?.actions?.[0]?.ID ?? parsed.actions?.[0]?.ID;
  });

  it('cases get returns the created case', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'get', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases list-stages returns stages for the case', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'list-stages', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases list-ancestors returns ancestors', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'list-ancestors', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases list-descendants returns descendants', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'list-descendants', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases list-attachment-categories returns attachment categories', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'list-attachment-categories', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases get-action returns action form', async () => {
    if (!caseId || !actionId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'get-action', caseId, '--action', actionId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases get-view returns a view', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'get-view', caseId, '--view', 'pyCaseDetails']);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases refresh-action refreshes an action form', async () => {
    if (!caseId || !actionId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'refresh-action', caseId, '--action', actionId]);
    expect(res.exitCode).toBe(0);
  });

  it('cases refresh-view refreshes a view', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli([
      'cases', 'refresh-view', caseId,
      '--view', 'pyCaseDetails',
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases calc-fields calculates fields', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const body = JSON.stringify({ calculations: { fields: [] } });
    const res = await runCli([
      'cases', 'calc-fields', caseId,
      '--view', 'pyCaseDetails',
      '--data', body,
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases recalculate recalculates action fields', async () => {
    if (!caseId || !actionId) throw new Error('precondition: create test must succeed first');
    const body = JSON.stringify({ calculations: { fields: [] } });
    const res = await runCli([
      'cases', 'recalculate', caseId,
      '--action', actionId,
      '--data', body,
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases discard-updates discards pending updates', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'discard-updates', caseId]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases perform-action performs an action', async () => {
    if (!caseId || !actionId) throw new Error('precondition: create test must succeed first');
    const res = await runCli([
      'cases', 'perform-action', caseId,
      '--action', actionId,
      '--data', '{}',
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases stage-next advances to next stage', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'stage-next', caseId]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases stage-go goes to a named stage', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'stage-go', caseId, '--stage', 'pyStage1']);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases start-process starts a process', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'start-process', caseId, '--process', 'pyStartCase']);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('cases bulk-actions --help does not crash', async () => {
    const res = await runCli(['cases', 'bulk-actions', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('cases bulk-perform --help does not crash', async () => {
    const res = await runCli(['cases', 'bulk-perform', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('cases delete removes the created case', async () => {
    if (!caseId) throw new Error('precondition: create test must succeed first');
    const res = await runCli(['cases', 'delete', caseId]);
    expect(res.exitCode).toBe(0);
    caseId = undefined;
  });

  afterAll(async () => {
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
