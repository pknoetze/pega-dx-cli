import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('ai-agents');

(SKIP ? describe.skip : describe)('smoke: ai-agents', () => {
  let conversationID: string | undefined;
  let postedMessageId: string | undefined;

  it('ai-agents list returns exit 0', async () => {
    const res = await runCli(['ai-agents', 'list']);
    expect(res.exitCode).toBe(0);
  });

  it('ai-agents start-conversation creates a conversation', async () => {
    const res = await runCli(['ai-agents', 'start-conversation', fx.agentID]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    expect(parsed.ID).toBeDefined();
    conversationID = parsed.ID;
  });

  it('ai-agents list-conversations returns conversations', async () => {
    const res = await runCli([
      'ai-agents', 'list-conversations', fx.agentID,
      '--context-id', fx.caseTypeID,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('ai-agents get-conversation returns conversation', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'ai-agents', 'get-conversation', fx.agentID,
      '--conversation', conversationID,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('ai-agents send-message sends a message', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'ai-agents', 'send-message', fx.agentID,
      '--conversation', conversationID,
      '--request', 'Hello',
    ]);
    expect(res.exitCode).toBe(0);
    postedMessageId = JSON.parse(res.stdout)?.ID ?? JSON.parse(res.stdout)?.messageID;
  });

  it('ai-agents like likes a message', async () => {
    if (!conversationID || !postedMessageId) throw new Error('precondition: send-message must succeed first');
    const res = await runCli([
      'ai-agents', 'like', fx.agentID,
      '--conversation', conversationID,
      '--message', postedMessageId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('ai-agents dislike dislikes a message', async () => {
    if (!conversationID || !postedMessageId) throw new Error('precondition: send-message must succeed first');
    const res = await runCli([
      'ai-agents', 'dislike', fx.agentID,
      '--conversation', conversationID,
      '--message', postedMessageId,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('ai-agents close-conversation closes a conversation', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'ai-agents', 'close-conversation', fx.agentID,
      '--conversation', conversationID,
    ]);
    expect(res.exitCode).toBe(0);
    conversationID = undefined;
  });

  afterAll(async () => {
    if (conversationID) {
      await runCli([
        'ai-agents', 'close-conversation', fx.agentID,
        '--conversation', conversationID,
      ]);
    }
  });
});
