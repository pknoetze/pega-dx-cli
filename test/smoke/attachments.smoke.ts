import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('attachments');

(SKIP ? describe.skip : describe)('smoke: attachments', () => {
  let caseId: string | undefined;
  let attachmentId: string | undefined;
  let uploadedId: string | undefined;
  let tmpFile: string | undefined;

  beforeAll(async () => {
    // Bootstrap a case to attach files to
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (res.exitCode === 0) {
      caseId = JSON.parse(res.stdout).ID;
    }
    // Create a temporary file to upload
    tmpFile = path.join(os.tmpdir(), `pega-smoke-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'smoke test attachment content');
  });

  it('attachments upload uploads a file', async () => {
    if (!tmpFile) return;
    const res = await runCli(['attachments', 'upload', '--file', tmpFile]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    uploadedId = parsed.ID;
    expect(uploadedId).toBeDefined();
  });

  it('attachments add attaches uploaded file to a case', async () => {
    if (!caseId || !uploadedId) return;
    const attachments = JSON.stringify([{ ID: uploadedId, name: 'smoke.txt', type: 'FILE' }]);
    const res = await runCli(['attachments', 'add', caseId, '--attachments', attachments]);
    expect(res.exitCode).toBe(0);
  });

  it('attachments list lists attachments on a case', async () => {
    if (!caseId) return;
    const res = await runCli(['attachments', 'list', caseId]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    const items: Array<{ ID: string }> = parsed.attachments ?? parsed;
    const first = items[0];
    if (first) {
      attachmentId = first.ID;
    }
  });

  it('attachments get retrieves attachment metadata', async () => {
    if (!attachmentId) return;
    const res = await runCli(['attachments', 'get', attachmentId]);
    expect(res.exitCode).toBe(0);
  });

  it('attachments patch renames an attachment', async () => {
    if (!attachmentId) return;
    const res = await runCli([
      'attachments', 'patch', attachmentId,
      '--name', 'smoke-renamed.txt',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('attachments delete removes an attachment', async () => {
    if (!attachmentId) return;
    const res = await runCli(['attachments', 'delete', attachmentId]);
    expect(res.exitCode).toBe(0);
    attachmentId = undefined;
  });

  afterAll(async () => {
    if (tmpFile && fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
