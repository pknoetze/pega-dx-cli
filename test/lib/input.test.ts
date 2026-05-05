import { describe, test, expect, jest } from '@jest/globals';
import { resetMockFs, seedFile } from '../helpers/mock-filesystem.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { parseDataInput, composeMutationBody } = await import('../../src/lib/input.js');

describe('parseDataInput', () => {
  test('parses inline JSON', async () => {
    expect(await parseDataInput('{"a":1}')).toEqual({ a: 1 });
  });

  test('reads and parses @file.json', async () => {
    resetMockFs();
    seedFile('/tmp/data.json', '{"k":"v"}');
    expect(await parseDataInput('@/tmp/data.json')).toEqual({ k: 'v' });
  });

  test('invalid JSON throws INVALID_ARGS', async () => {
    await expect(parseDataInput('{bad')).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('reads from stdin when value is "-"', async () => {
    const stdin = '{"fromStdin":true}';
    const { Readable } = await import('node:stream');
    const orig = process.stdin;
    const mock = Readable.from([stdin]);
    Object.defineProperty(process, 'stdin', { value: mock, configurable: true });
    try {
      expect(await parseDataInput('-')).toEqual({ fromStdin: true });
    } finally {
      Object.defineProperty(process, 'stdin', { value: orig, configurable: true });
    }
  });
});

describe('composeMutationBody', () => {
  describe("shape: 'action'", () => {
    test('no flags → {}', async () => {
      const result = await composeMutationBody({}, 'action');
      expect(result).toEqual({});
    });

    test('--data only → {content}', async () => {
      const result = await composeMutationBody(
        { data: '{"reason":"OK"}' },
        'action',
      );
      expect(result).toEqual({ content: { reason: 'OK' } });
    });

    test('--data + --page-instructions → {content, pageInstructions}', async () => {
      const result = await composeMutationBody(
        {
          data: '{"reason":"OK"}',
          'page-instructions': '[{"instruction":"add"}]',
        },
        'action',
      );
      expect(result).toEqual({
        content: { reason: 'OK' },
        pageInstructions: [{ instruction: 'add' }],
      });
    });

    test('all three flags → {content, pageInstructions, attachments}', async () => {
      const result = await composeMutationBody(
        {
          data: '{"reason":"OK"}',
          'page-instructions': '[]',
          attachments: '[{"type":"File","ID":"a"}]',
        },
        'action',
      );
      expect(result).toEqual({
        content: { reason: 'OK' },
        pageInstructions: [],
        attachments: [{ type: 'File', ID: 'a' }],
      });
    });
  });

  describe("shape: 'refresh'", () => {
    test('--data + --interest-page + --interest-page-action-id', async () => {
      const result = await composeMutationBody(
        {
          data: '{"X":1}',
          'interest-page': '.OrderItems(1)',
          'interest-page-action-id': 'EmbeddedAction',
        },
        'refresh',
      );
      expect(result).toEqual({
        content: { X: 1 },
        interestPage: '.OrderItems(1)',
        interestPageActionID: 'EmbeddedAction',
      });
    });

    test('--page-instructions only', async () => {
      const result = await composeMutationBody(
        { 'page-instructions': '[]' },
        'refresh',
      );
      expect(result).toEqual({ pageInstructions: [] });
    });

    test('--attachments → throws INVALID_ARGS', async () => {
      await expect(
        composeMutationBody({ attachments: '[]' }, 'refresh'),
      ).rejects.toMatchObject({
        code: 'INVALID_ARGS',
        message: expect.stringContaining('refresh'),
      });
    });
  });

  describe("shape: 'navigate'", () => {
    test('all three flags → {content, pageInstructions, attachments}', async () => {
      const result = await composeMutationBody(
        {
          data: '{"k":"v"}',
          'page-instructions': '[]',
          attachments: '[]',
        },
        'navigate',
      );
      expect(result).toEqual({
        content: { k: 'v' },
        pageInstructions: [],
        attachments: [],
      });
    });
  });

  describe('error propagation', () => {
    test('invalid JSON in --data propagates parse error', async () => {
      await expect(
        composeMutationBody({ data: 'not-json' }, 'action'),
      ).rejects.toMatchObject({
        code: 'INVALID_ARGS',
        message: expect.stringContaining('Invalid JSON'),
      });
    });

    test('@file mode is honoured', async () => {
      // Use memfs (mocked for the imported module)
      resetMockFs();
      const path = '/tmp/mut-body-data.json';
      seedFile(path, '{"fromFile":true}');
      const result = await composeMutationBody(
        { data: `@${path}` },
        'action',
      );
      expect(result).toEqual({ content: { fromFile: true } });
    });
  });
});
