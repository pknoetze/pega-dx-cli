import { describe, test, expect, jest } from '@jest/globals';
import { resetMockFs, seedFile } from '../helpers/mock-filesystem.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { parseDataInput } = await import('../../src/lib/input.js');

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
