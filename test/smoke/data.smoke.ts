import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('data');

(SKIP ? describe.skip : describe)('smoke: data', () => {
  it('data list-objects lists data objects', async () => {
    const res = await runCli(['data', 'list-objects']);
    expect(res.exitCode).toBe(0);
  });

  it('data list-pages lists data pages', async () => {
    const res = await runCli(['data', 'list-pages']);
    expect(res.exitCode).toBe(0);
  });

  it('data get-metadata returns metadata for a data view', async () => {
    const res = await runCli(['data', 'get-metadata', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data get returns a data view', async () => {
    const res = await runCli(['data', 'get', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data query returns query results', async () => {
    const res = await runCli(['data', 'query', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data query-metadata returns query metadata', async () => {
    const res = await runCli(['data', 'query-metadata', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data count returns record count', async () => {
    const res = await runCli(['data', 'count', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data list-actions lists available actions', async () => {
    const res = await runCli(['data', 'list-actions', fx.data_view_ID]);
    expect(res.exitCode).toBe(0);
  });

  it('data query-view --help does not crash', async () => {
    // query-view requires a --view flag specific to the data view; verify it loads
    const res = await runCli(['data', 'query-view', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data create --help does not crash', async () => {
    const res = await runCli(['data', 'create', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data update --help does not crash', async () => {
    const res = await runCli(['data', 'update', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data patch --help does not crash', async () => {
    const res = await runCli(['data', 'patch', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data delete --help does not crash', async () => {
    const res = await runCli(['data', 'delete', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data get-action --help does not crash', async () => {
    const res = await runCli(['data', 'get-action', '--help']);
    expect(res.exitCode).toBe(0);
  });

  it('data perform-action --help does not crash', async () => {
    const res = await runCli(['data', 'perform-action', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
