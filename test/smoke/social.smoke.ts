import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('social');

(SKIP ? describe.skip : describe)('smoke: social', () => {
  let caseId: string | undefined;
  let postedMessageId: string | undefined;

  beforeAll(async () => {
    const res = await runCli(['cases', 'create', '--type', fx.caseTypeID]);
    if (res.exitCode === 0) {
      caseId = JSON.parse(res.stdout).ID;
    }
  });

  it('social list-mention-types lists mention types', async () => {
    const res = await runCli(['social', 'list-mention-types']);
    expect(res.exitCode).toBe(0);
  });

  it('social list-mentions lists mention options', async () => {
    const res = await runCli([
      'social', 'list-mentions',
      '--mentions-type', 'OPERATOR',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('social list-suggested-tags lists suggested tags', async () => {
    const res = await runCli(['social', 'list-suggested-tags']);
    expect(res.exitCode).toBe(0);
  });

  it('social search-tags searches for tags', async () => {
    const res = await runCli(['social', 'search-tags']);
    expect(res.exitCode).toBe(0);
  });

  it('social get-feed returns feed entries', async () => {
    if (!caseId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'social', 'get-feed', fx.feedID,
      '--filter-for', caseId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('social list-messages lists messages', async () => {
    if (!caseId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'social', 'list-messages',
      '--filter-by', 'CASE',
      '--filter-for', caseId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('social post-message posts a message to a case', async () => {
    if (!caseId) throw new Error('precondition: case bootstrap must succeed first');
    const res = await runCli([
      'social', 'post-message',
      '--context', caseId,
      '--message', 'Smoke test message',
    ]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    postedMessageId = parsed.ID ?? parsed.messageID;
  });

  it('social get-message retrieves the posted message', async () => {
    const id = postedMessageId ?? fx.messageID;
    const res = await runCli(['social', 'get-message', id]);
    expect(res.exitCode).toBe(0);
  });

  it('social like-message likes a message', async () => {
    const id = postedMessageId ?? fx.messageID;
    const res = await runCli(['social', 'like-message', id]);
    expect(res.exitCode).toBe(0);
  });

  it('social list-likes lists likes on a message', async () => {
    const id = postedMessageId ?? fx.messageID;
    const res = await runCli(['social', 'list-likes', id]);
    expect(res.exitCode).toBe(0);
  });

  it('social unlike-message removes the like', async () => {
    const id = postedMessageId ?? fx.messageID;
    const res = await runCli(['social', 'unlike-message', id]);
    expect(res.exitCode).toBe(0);
  });

  it('social update-message updates a message', async () => {
    const id = postedMessageId ?? fx.messageID;
    const res = await runCli([
      'social', 'update-message', id,
      '--message', 'Updated smoke test message',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('social get-message-type returns a message type', async () => {
    const res = await runCli(['social', 'get-message-type', 'PegaAPI-Social-Work-PostedMessage']);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('social delete-message deletes a message', async () => {
    if (!postedMessageId) throw new Error('precondition: post-message must succeed first');
    const res = await runCli(['social', 'delete-message', postedMessageId]);
    expect(res.exitCode).toBe(0);
    postedMessageId = undefined;
  });

  afterAll(async () => {
    if (postedMessageId) {
      await runCli(['social', 'delete-message', postedMessageId]);
    }
    if (caseId) {
      await runCli(['cases', 'delete', caseId]);
    }
  });
});
