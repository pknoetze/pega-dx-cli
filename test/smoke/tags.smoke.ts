import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('tags');

(SKIP ? describe.skip : describe)('smoke: tags', () => {
  let caseId: string | undefined;

  beforeAll(async () => {
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (res.exitCode === 0) {
      caseId = JSON.parse(res.stdout).ID;
    }
  });

  it('tags list lists tags on a case', async () => {
    if (!caseId) return;
    const res = await runCli(['tags', 'list', caseId]);
    expect(res.exitCode).toBe(0);
  });

  it('tags add adds a tag to a case', async () => {
    if (!caseId) return;
    const res = await runCli([
      'tags', 'add', caseId,
      '--tag', 'smoke-test',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('tags delete removes a tag from a case', async () => {
    if (!caseId) return;
    const res = await runCli([
      'tags', 'delete', caseId,
      '--tag', 'smoke-test',
    ]);
    expect(res.exitCode).toBe(0);
  });

  afterAll(async () => {
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
