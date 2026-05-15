import * as os from 'node:os';
import * as path from 'node:path';
import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('static-content');

(SKIP ? describe.skip : describe)('smoke: static-content', () => {
  it('static-content component returns component JS', async () => {
    const res = await runCli(['static-content', 'component', fx.componentID]);
    expect(res.exitCode).toBe(0);
  });

  it('static-content file writes binary file to a temp path', async () => {
    const outPath = path.join(os.tmpdir(), `pega-smoke-static-${Date.now()}.bin`);
    const res = await runCli([
      'static-content', 'file', fx.fileID,
      '--output', outPath,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('static-content profile-image --help does not crash', async () => {
    // profile-image requires a valid user ID; verify the command loads
    const res = await runCli(['static-content', 'profile-image', '--help']);
    expect(res.exitCode).toBe(0);
  });
});
