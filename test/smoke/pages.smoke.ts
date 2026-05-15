import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('pages');

(SKIP ? describe.skip : describe)('smoke: pages', () => {
  it('pages portal returns portal page', async () => {
    const res = await runCli(['pages', 'portal', fx.portalID]);
    expect(res.exitCode).toBe(0);
  });

  it('pages dashboard returns dashboard page', async () => {
    const res = await runCli(['pages', 'dashboard', fx.dashboardID]);
    expect(res.exitCode).toBe(0);
  });

  it('pages insight returns insight page', async () => {
    const res = await runCli(['pages', 'insight', fx.insightID]);
    expect(res.exitCode).toBe(0);
  });

  it('pages get returns a page by ID', async () => {
    const res = await runCli(['pages', 'get', fx.pageID]);
    expect(res.exitCode).toBe(0);
  });

  it('pages channel returns channel page', async () => {
    const res = await runCli(['pages', 'channel', fx.channelID]);
    expect(res.exitCode).toBe(0);
  });

  it('pages localization returns locale bundle', async () => {
    const res = await runCli(['pages', 'localization', fx.locale]);
    expect(res.exitCode).toBe(0);
  });

  it('pages get-with-context returns page with data context', async () => {
    const res = await runCli([
      'pages', 'get-with-context', fx.pageID,
      '--data-context', fx.caseTypeID,
    ]);
    expect(res.exitCode).toBe(0);
  });
});
