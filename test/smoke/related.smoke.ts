import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('related');

(SKIP ? describe.skip : describe)('smoke: related', () => {
  let caseIdA: string | undefined;
  let caseIdB: string | undefined;

  beforeAll(async () => {
    const [resA, resB] = await Promise.all([
      runCli(['cases', 'create', '--type', fx.caseTypeID]),
      runCli(['cases', 'create', '--type', fx.caseTypeID]),
    ]);
    if (resA.exitCode === 0) caseIdA = JSON.parse(resA.stdout).ID;
    if (resB.exitCode === 0) caseIdB = JSON.parse(resB.stdout).ID;
  });

  it('related list lists related cases', async () => {
    if (!caseIdA) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli(['related', 'list', caseIdA]);
    expect(res.exitCode).toBe(0);
  });

  it('related add links two cases together', async () => {
    if (!caseIdA || !caseIdB) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'related', 'add', caseIdA,
      '--related-case-id', caseIdB,
      '--relationship', 'duplicates',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('related delete unlinks two cases', async () => {
    if (!caseIdA || !caseIdB) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'related', 'delete', caseIdA,
      '--related-case-id', caseIdB,
    ]);
    expect(res.exitCode).toBe(0);
  });

  afterAll(async () => {
    await Promise.all([
      caseIdA ? runCli(['cases', 'delete', caseIdA]) : Promise.resolve(),
      caseIdB ? runCli(['cases', 'delete', caseIdB]) : Promise.resolve(),
    ]);
  });
});
