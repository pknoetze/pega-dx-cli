import { runCli } from '../smoke/lib/runner.js';
import { loadFixtures } from '../smoke/lib/fixtures.js';

describe('runCli (framework self-test)', () => {
  it('runs `pega --version` and returns exit 0', async () => {
    const res = await runCli(['--version']);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it('captures exit code 2 for unknown command', async () => {
    const res = await runCli(['no-such-command-xyz']);
    expect(res.exitCode).not.toBe(0);
    expect(res.stderr.length).toBeGreaterThan(0);
  });
});

describe('loadFixtures', () => {
  it('is a function that returns an object with caseTypeID and skip array', () => {
    const fx = loadFixtures();
    expect(typeof fx.caseTypeID).toBe('string');
    expect(Array.isArray(fx.skip)).toBe(true);
  });
});
