import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('participants');

(SKIP ? describe.skip : describe)('smoke: participants', () => {
  let caseId: string | undefined;
  let participantId: string | undefined;
  let roleId: string | undefined;

  beforeAll(async () => {
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (res.exitCode === 0) {
      caseId = JSON.parse(res.stdout).ID;
    }
  });

  it('participants list-roles lists available roles', async () => {
    if (!caseId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli(['participants', 'list-roles', caseId]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    const roles: Array<{ ID: string }> = parsed.participantRoles ?? parsed;
    const firstRole = roles[0];
    if (firstRole) {
      roleId = firstRole.ID;
    }
  });

  it('participants list lists participants on a case', async () => {
    if (!caseId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli(['participants', 'list', caseId]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    const items: Array<{ participantID: string }> = parsed.participants ?? parsed;
    const firstItem = items[0];
    if (firstItem) {
      participantId = firstItem.participantID;
    }
  });

  it('participants get-role returns participants for a role', async () => {
    if (!caseId || !roleId) throw new Error('precondition: case bootstrap and list-roles must succeed first');
    const res = await runCli([
      'participants', 'get-role', caseId,
      '--role-id', roleId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('participants add adds a participant', async () => {
    if (!caseId || !roleId) throw new Error('precondition: case bootstrap and list-roles must succeed first');
    const data = JSON.stringify({
      pyFirstName: 'Smoke',
      pyLastName: 'Test',
      pyEmail1: 'smoke@example.com',
    });
    const res = await runCli([
      'participants', 'add', caseId,
      '--role', roleId,
      '--data', data,
    ]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    participantId = parsed.participantID ?? participantId;
  });

  it('participants get returns a participant', async () => {
    if (!caseId || !participantId) throw new Error('precondition: participants list or add must succeed first');
    const res = await runCli([
      'participants', 'get', caseId,
      '--participant-id', participantId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('participants update updates a participant', async () => {
    if (!caseId || !participantId) throw new Error('precondition: participants list or add must succeed first');
    const data = JSON.stringify({ pyFirstName: 'SmokeUpdated' });
    const res = await runCli([
      'participants', 'update', caseId,
      '--participant-id', participantId,
      '--data', data,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('participants delete removes a participant', async () => {
    if (!caseId || !participantId) throw new Error('precondition: participants list or add must succeed first');
    const res = await runCli([
      'participants', 'delete', caseId,
      '--participant-id', participantId,
    ]);
    expect(res.exitCode).toBe(0);
    participantId = undefined;
  });

  afterAll(async () => {
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
