import { describe, test, expect, jest } from '@jest/globals';
import { resetMockFs, seedFile } from '../helpers/mock-filesystem.js';

jest.unstable_mockModule('node:fs', async () => {
  const memfs = await import('memfs');
  return { ...memfs.fs, default: memfs.fs };
});

const { readDataFlag } = await import('../../src/lib/input.js');

describe('readDataFlag', () => {
  test('parses inline JSON', async () => {
    expect(await readDataFlag('{"a":1}')).toEqual({ a: 1 });
  });

  test('reads and parses @file.json', async () => {
    resetMockFs();
    seedFile('/tmp/data.json', '{"k":"v"}');
    expect(await readDataFlag('@/tmp/data.json')).toEqual({ k: 'v' });
  });

  test('invalid JSON throws INVALID_ARGS', async () => {
    await expect(readDataFlag('{bad')).rejects.toMatchObject({ code: 'INVALID_ARGS' });
  });

  test('reads from stdin when value is "-"', async () => {
    const stdin = '{"fromStdin":true}';
    const { Readable } = await import('node:stream');
    const orig = process.stdin;
    const mock = Readable.from([stdin]);
    Object.defineProperty(process, 'stdin', { value: mock, configurable: true });
    try {
      expect(await readDataFlag('-')).toEqual({ fromStdin: true });
    } finally {
      Object.defineProperty(process, 'stdin', { value: orig, configurable: true });
    }
  });
});
