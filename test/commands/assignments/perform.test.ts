import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import nock from 'nock';
import AssignmentsPerform from '../../../src/commands/assignments/perform.js';
import { mockOAuthSuccess, cleanupNock } from '../../helpers/mock-pega-api.js';
import { captureOutput, parseFirstJson } from '../../helpers/capture-output.js';
import {
  setPromptRunner,
  resetPromptRunner,
  type PromptRunner,
} from '../../../src/lib/interactive.js';

let origEmitWarning: typeof process.emitWarning;

describe('assignments perform', () => {
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
    if (!nock.isActive()) nock.activate();
    origEmitWarning = process.emitWarning;
    process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
      const msg = typeof warning === 'string' ? warning : ((warning as { message?: string }).message ?? String(warning));
      origEmitWarning.call(process, msg, ...(args as []));
    };
  });
  afterEach(() => {
    cleanupNock();
    process.emitWarning = origEmitWarning;
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('PATCHes with full body shape (encoding included)', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    const id = 'ASSIGN WITH SPACE';
    const encoded = encodeURIComponent(id);
    nock('https://pega.example.com')
      .get(`/prweb/api/application/v2/assignments/${encoded}`)
      .reply(200, { id }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com', {
      reqheaders: { 'if-match': '"e1"' },
    })
      .patch(
        `/prweb/api/application/v2/assignments/${encoded}/actions/Submit`,
        {
          content: { x: 1 },
          pageInstructions: [],
          attachments: [],
        },
      )
      .reply(200, { ok: true });
    const captured = captureOutput();
    try {
      await AssignmentsPerform.run([
        id,
        '--action',
        'Submit',
        '--data',
        '{"x":1}',
        '--page-instructions',
        '[]',
        '--attachments',
        '[]',
      ]);
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });
});

describe('assignments perform — --interactive flag', () => {
  let origStdin: boolean | undefined;
  let origStdout: boolean | undefined;
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
    if (!nock.isActive()) nock.activate();
    origStdin = process.stdin.isTTY;
    origStdout = process.stdout.isTTY;
    origEmitWarning = process.emitWarning;
    process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
      const msg = typeof warning === 'string' ? warning : ((warning as { message?: string }).message ?? String(warning));
      origEmitWarning.call(process, msg, ...(args as []));
    };
  });
  afterEach(() => {
    cleanupNock();
    (process.stdin as { isTTY?: boolean }).isTTY = origStdin;
    (process.stdout as { isTTY?: boolean }).isTTY = origStdout;
    process.emitWarning = origEmitWarning;
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('fall-through: stdin not a TTY → warning on stderr + non-interactive path runs', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = false;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(200, { id: 'ASSIGN-1' }, { ETag: '"e1"' });
    const scope = nock('https://pega.example.com', { reqheaders: { 'if-match': '"e1"' } })
      .patch('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit', { content: {} })
      .reply(200, { ok: true });

    const captured = captureOutput();
    try {
      await AssignmentsPerform.run([
        'ASSIGN-1', '--interactive', '--action', 'Submit', '--data', '{}',
      ]);
      expect(captured.stderr.join('')).toContain('--interactive flag ignored: stdin is not a TTY');
      expect(scope.isDone()).toBe(true);
    } finally {
      captured.restore();
    }
  });

  test('TTY + --interactive + --action → INVALID_ARGS, exit 2, no network', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    const captured = captureOutput();
    try {
      await expect(
        AssignmentsPerform.run(['ASSIGN-1', '--interactive', '--action', 'Submit']),
      ).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });

  test('TTY + --interactive + --data → INVALID_ARGS', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    const captured = captureOutput();
    try {
      await expect(
        AssignmentsPerform.run(['ASSIGN-1', '--interactive', '--data', '{}']),
      ).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });

  test('TTY + --interactive + --page-instructions → INVALID_ARGS', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    const captured = captureOutput();
    try {
      await expect(
        AssignmentsPerform.run(['ASSIGN-1', '--interactive', '--page-instructions', '[]']),
      ).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });

  test('TTY + --interactive + --attachments → INVALID_ARGS', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    const captured = captureOutput();
    try {
      await expect(
        AssignmentsPerform.run(['ASSIGN-1', '--interactive', '--attachments', '[]']),
      ).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });

  test('TTY + --interactive + --dry-run → INVALID_ARGS', async () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;

    const captured = captureOutput();
    try {
      await expect(
        AssignmentsPerform.run(['ASSIGN-1', '--interactive', '--dry-run']),
      ).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });

  test('non-interactive without --action → INVALID_ARGS, exit 2', async () => {
    const captured = captureOutput();
    try {
      await expect(AssignmentsPerform.run(['ASSIGN-1'])).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string };
      expect(err.code).toBe('INVALID_ARGS');
    } finally {
      captured.restore();
    }
  });
});

describe('assignments perform — interactive wizard', () => {
  let origStdin: boolean | undefined;
  let origStdout: boolean | undefined;
  beforeEach(() => {
    process.env.PEGA_BASE_URL = 'https://pega.example.com';
    process.env.PEGA_CLIENT_ID = 'cid';
    process.env.PEGA_CLIENT_SECRET = 'sec';
    process.env.PEGA_NO_CACHE = 'true';
    if (!nock.isActive()) nock.activate();
    origStdin = process.stdin.isTTY;
    origStdout = process.stdout.isTTY;
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;
    origEmitWarning = process.emitWarning;
    process.emitWarning = (warning: string | Error, ...args: unknown[]) => {
      const msg = typeof warning === 'string' ? warning : ((warning as { message?: string }).message ?? String(warning));
      origEmitWarning.call(process, msg, ...(args as []));
    };
  });
  afterEach(() => {
    cleanupNock();
    (process.stdin as { isTTY?: boolean }).isTTY = origStdin;
    (process.stdout as { isTTY?: boolean }).isTTY = origStdout;
    process.emitWarning = origEmitWarning;
    resetPromptRunner();
    delete process.env.PEGA_BASE_URL;
    delete process.env.PEGA_CLIENT_ID;
    delete process.env.PEGA_CLIENT_SECRET;
    delete process.env.PEGA_NO_CACHE;
  });

  test('GET assignment → pick action → GET view → prompt → confirm → PATCH', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');

    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(
        200,
        { id: 'ASSIGN-1', actions: [{ ID: 'Submit', name: 'Submit Form' }] },
        { ETag: '"e1"' },
      );
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit')
      .reply(200, {
        uiResources: {
          resources: {
            fields: {
              firstName: { type: 'pxTextInput', label: 'First Name', required: true },
              age: { type: 'pxInteger', label: 'Age', required: true },
            },
          },
        },
      });
    const patchScope = nock('https://pega.example.com', { reqheaders: { 'if-match': '"e1"' } })
      .patch('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit', {
        content: { firstName: 'Alice', age: 30 },
      })
      .reply(200, { ok: true, ref: 'CASE-1' });

    const runner: PromptRunner = async (questions) => {
      const first = questions[0]!;
      if (first.type === 'list') return { action: 'Submit' };
      if (first.type === 'confirm') return { confirmed: true };
      return { firstName: 'Alice', age: 30 };
    };
    setPromptRunner(runner);

    const captured = captureOutput();
    try {
      await AssignmentsPerform.run(['ASSIGN-1', '--interactive']);
      expect(patchScope.isDone()).toBe(true);
      const out = JSON.parse(captured.stdout.join(''));
      expect(out).toEqual({ ok: true, ref: 'CASE-1' });
    } finally {
      captured.restore();
    }
  });

  test('user cancels at confirm → no PATCH, clean return, "cancelled" on stderr', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');

    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(
        200,
        { id: 'ASSIGN-1', actions: [{ ID: 'Submit', name: 'Submit' }] },
        { ETag: '"e1"' },
      );
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit')
      .reply(200, {
        uiResources: {
          resources: { fields: { firstName: { type: 'pxTextInput', label: 'First', required: true } } },
        },
      });

    const runner: PromptRunner = async (questions) => {
      const first = questions[0]!;
      if (first.type === 'list') return { action: 'Submit' };
      if (first.type === 'confirm') return { confirmed: false };
      return { firstName: 'Alice' };
    };
    setPromptRunner(runner);

    const captured = captureOutput();
    try {
      await AssignmentsPerform.run(['ASSIGN-1', '--interactive']);
      expect(captured.stderr.join('')).toContain('cancelled');
    } finally {
      captured.restore();
    }
  });

  test('no actions available → INVALID_ARGS', async () => {
    mockOAuthSuccess('https://pega.example.com');

    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(200, { id: 'ASSIGN-1', actions: [] }, { ETag: '"e1"' });

    const captured = captureOutput();
    try {
      await expect(AssignmentsPerform.run(['ASSIGN-1', '--interactive'])).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string; message: string };
      expect(err.code).toBe('INVALID_ARGS');
      expect(err.message).toContain('no available actions');
    } finally {
      captured.restore();
    }
  });

  test('action view has no recognisable fields → INVALID_ARGS recommending --data', async () => {
    mockOAuthSuccess('https://pega.example.com');
    mockOAuthSuccess('https://pega.example.com');

    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1')
      .reply(
        200,
        { id: 'ASSIGN-1', actions: [{ ID: 'Submit', name: 'Submit' }] },
        { ETag: '"e1"' },
      );
    nock('https://pega.example.com')
      .get('/prweb/api/application/v2/assignments/ASSIGN-1/actions/Submit')
      .reply(200, { uiResources: {} });

    setPromptRunner(async () => ({ action: 'Submit' }));

    const captured = captureOutput();
    try {
      await expect(AssignmentsPerform.run(['ASSIGN-1', '--interactive'])).rejects.toThrow();
      const err = parseFirstJson(captured.stderr) as { code: string; message: string };
      expect(err.code).toBe('INVALID_ARGS');
      expect(err.message).toContain('--data');
    } finally {
      captured.restore();
    }
  });
});
