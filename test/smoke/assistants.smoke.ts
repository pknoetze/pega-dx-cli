import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('assistants');

(SKIP ? describe.skip : describe)('smoke: assistants', () => {
  let conversationID: string | undefined;

  it('assistants start-conversation creates a conversation', async () => {
    const res = await runCli(['assistants', 'start-conversation', fx.assistantID]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    expect(parsed.ID).toBeDefined();
    conversationID = parsed.ID;
  });

  it('assistants list-conversations lists conversations', async () => {
    const res = await runCli([
      'assistants', 'list-conversations', fx.assistantID,
      '--context-id', fx.caseTypeID,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assistants get-conversation returns conversation', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'assistants', 'get-conversation', fx.assistantID,
      '--conversation', conversationID,
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assistants send-message sends a message', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'assistants', 'send-message', fx.assistantID,
      '--conversation', conversationID,
      '--request', 'Hello',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('assistants close-conversation closes a conversation', async () => {
    if (!conversationID) throw new Error('precondition: start-conversation must succeed first');
    const res = await runCli([
      'assistants', 'close-conversation', fx.assistantID,
      '--conversation', conversationID,
    ]);
    expect(res.exitCode).toBe(0);
    conversationID = undefined;
  });

  afterAll(async () => {
    if (conversationID) {
      await runCli([
        'assistants', 'close-conversation', fx.assistantID,
        '--conversation', conversationID,
      ]);
    }
  });
});
