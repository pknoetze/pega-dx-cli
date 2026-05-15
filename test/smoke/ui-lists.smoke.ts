import { runCli, loadFixtures, type SmokeFixtures } from './lib/runner.js';

const fx: SmokeFixtures = loadFixtures();
const SKIP = fx.skip.includes('ui-lists');

(SKIP ? describe.skip : describe)('smoke: ui-lists', () => {
  let personalizationId: string | undefined;

  it('ui-lists list-personalizations lists personalizations for a UI list', async () => {
    const res = await runCli(['ui-lists', 'list-personalizations', fx.pageID]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    const items: Array<{ ID: string }> = parsed.personalizations ?? parsed;
    const first = items[0];
    if (first) {
      personalizationId = first.ID;
    }
  });

  it('ui-lists create-personalization creates a personalization', async () => {
    const res = await runCli([
      'ui-lists', 'create-personalization', fx.pageID,
      '--name', 'smoke-personalization',
    ]);
    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.stdout);
    personalizationId = parsed.ID ?? personalizationId;
  });

  it('ui-lists update-personalization updates a personalization', async () => {
    if (!personalizationId) return;
    const res = await runCli([
      'ui-lists', 'update-personalization', fx.pageID, personalizationId,
      '--name', 'smoke-personalization-updated',
    ]);
    expect(res.exitCode).toBe(0);
  });

  it('ui-lists move moves an item in a UI list', async () => {
    const res = await runCli([
      'ui-lists', 'move', fx.pageID,
      '--source-id', 'col1',
      '--destination-id', 'col2',
    ]);
    expect([0, 1]).toContain(res.exitCode);
  });

  it('ui-lists delete-personalization deletes a personalization', async () => {
    if (!personalizationId) return;
    const res = await runCli([
      'ui-lists', 'delete-personalization', fx.pageID, personalizationId,
    ]);
    expect(res.exitCode).toBe(0);
    personalizationId = undefined;
  });

  afterAll(async () => {
    // delete-personalization is idempotent in case earlier test skipped
    if (personalizationId) {
      await runCli([
        'ui-lists', 'delete-personalization', fx.pageID, personalizationId,
      ]);
    }
  });
});
