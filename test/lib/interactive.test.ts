import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  extractActions,
  extractFields,
  validateDate,
  validateDateTime,
  validateRequiredText,
  validateNumber,
  isInteractiveTTY,
  pickAction,
  promptFields,
  confirmSubmit,
  setPromptRunner,
  resetPromptRunner,
  type PromptRunner,
} from '../../src/lib/interactive.js';

describe('extractActions', () => {
  test('top-level actions[] shape', () => {
    const r = { actions: [{ ID: 'Submit', name: 'Submit' }, { ID: 'Cancel', name: 'Cancel' }] };
    expect(extractActions(r)).toEqual([
      { id: 'Submit', label: 'Submit' },
      { id: 'Cancel', label: 'Cancel' },
    ]);
  });

  test('nested caseInfo.assignments[].actions[] shape', () => {
    const r = {
      data: {
        caseInfo: {
          assignments: [
            { actions: [{ ID: 'A1', name: 'First' }] },
            { actions: [{ ID: 'A2', name: 'Second' }] },
          ],
        },
      },
    };
    expect(extractActions(r)).toEqual([
      { id: 'A1', label: 'First' },
      { id: 'A2', label: 'Second' },
    ]);
  });

  test('dedupes by id, first wins', () => {
    const r = {
      data: {
        caseInfo: {
          assignments: [
            { actions: [{ ID: 'A1', name: 'First' }] },
            { actions: [{ ID: 'A1', name: 'Duplicate' }] },
          ],
        },
      },
    };
    expect(extractActions(r)).toEqual([{ id: 'A1', label: 'First' }]);
  });

  test('label falls back to id when name missing', () => {
    const r = { actions: [{ ID: 'Submit' }] };
    expect(extractActions(r)).toEqual([{ id: 'Submit', label: 'Submit' }]);
  });

  test('unknown shape returns []', () => {
    expect(extractActions({ noShape: true })).toEqual([]);
    expect(extractActions(null)).toEqual([]);
    expect(extractActions(undefined)).toEqual([]);
  });
});

describe('extractFields — uiResources.resources.fields shape', () => {
  test('maps text/integer/boolean required fields', () => {
    const view = {
      uiResources: {
        resources: {
          fields: {
            firstName: { type: 'pxTextInput', label: 'First Name', required: true },
            age: { type: 'pxInteger', label: 'Age', required: true },
            agreed: { type: 'pxCheckbox', label: 'Agreed', required: true },
          },
        },
      },
    };
    const fields = extractFields(view);
    expect(fields).toEqual([
      { fieldId: 'firstName', label: 'First Name', type: 'text', required: true },
      { fieldId: 'age', label: 'Age', type: 'number', required: true },
      { fieldId: 'agreed', label: 'Agreed', type: 'boolean', required: true },
    ]);
  });

  test('maps date/datetime fields', () => {
    const view = {
      uiResources: {
        resources: {
          fields: {
            dob: { type: 'pxDate', label: 'DOB', required: true },
            startAt: { type: 'pxDateTime', label: 'Start', required: true },
          },
        },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'dob', label: 'DOB', type: 'date', required: true },
      { fieldId: 'startAt', label: 'Start', type: 'datetime', required: true },
    ]);
  });

  test('filters out optional fields', () => {
    const view = {
      uiResources: {
        resources: {
          fields: {
            keep: { type: 'pxTextInput', label: 'Keep', required: true },
            drop: { type: 'pxTextInput', label: 'Drop', required: false },
          },
        },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'keep', label: 'Keep', type: 'text', required: true },
    ]);
  });

  test('unknown type falls back to text with annotated label', () => {
    const view = {
      uiResources: {
        resources: {
          fields: {
            status: { type: 'pxDropDown', label: 'Status', required: true },
          },
        },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'status', label: 'Status (pxDropDown)', type: 'text', required: true },
    ]);
  });

  test('label falls back to fieldId when missing', () => {
    const view = {
      uiResources: {
        resources: { fields: { foo: { type: 'pxTextInput', required: true } } },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'foo', label: 'foo', type: 'text', required: true },
    ]);
  });
});

describe('extractFields — uiResources.root.children[*] recursive shape', () => {
  test('flattens nested layout to fields', () => {
    const view = {
      uiResources: {
        root: {
          children: [
            {
              type: 'Region',
              children: [
                { type: 'Field', fieldID: 'a', label: 'A', config: { type: 'pxTextInput', required: true } },
                { type: 'Field', fieldID: 'b', label: 'B', config: { type: 'pxInteger', required: true } },
              ],
            },
          ],
        },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'a', label: 'A', type: 'text', required: true },
      { fieldId: 'b', label: 'B', type: 'number', required: true },
    ]);
  });

  test('dedupes repeated fieldIds (first wins)', () => {
    const view = {
      uiResources: {
        root: {
          children: [
            { type: 'Field', fieldID: 'x', label: 'First', config: { type: 'pxTextInput', required: true } },
            { type: 'Field', fieldID: 'x', label: 'Second', config: { type: 'pxTextInput', required: true } },
          ],
        },
      },
    };
    expect(extractFields(view)).toEqual([
      { fieldId: 'x', label: 'First', type: 'text', required: true },
    ]);
  });
});

describe('extractFields — unknown shape', () => {
  test('returns []', () => {
    expect(extractFields({})).toEqual([]);
    expect(extractFields(null)).toEqual([]);
    expect(extractFields({ uiResources: {} })).toEqual([]);
  });
});

describe('validators', () => {
  test('validateRequiredText: rejects empty/whitespace', () => {
    expect(validateRequiredText('  ')).toBe('Value is required');
    expect(validateRequiredText('')).toBe('Value is required');
    expect(validateRequiredText('hello')).toBe(true);
  });

  test('validateNumber: rejects non-numeric', () => {
    expect(validateNumber('abc')).toBe('Must be a number');
    expect(validateNumber('')).toBe('Must be a number');
    expect(validateNumber('42')).toBe(true);
    expect(validateNumber('3.14')).toBe(true);
  });

  test('validateDate: accepts ISO date, rejects garbage', () => {
    expect(validateDate('2026-05-14')).toBe(true);
    expect(validateDate('not-a-date')).toBe('Must be a valid date');
    expect(validateDate('')).toBe('Value is required');
  });

  test('validateDateTime: accepts ISO datetime, rejects garbage', () => {
    expect(validateDateTime('2026-05-14T10:30:00Z')).toBe(true);
    expect(validateDateTime('not-a-datetime')).toBe('Must be a valid date/time');
  });
});

describe('isInteractiveTTY', () => {
  let origStdin: boolean | undefined;
  let origStdout: boolean | undefined;
  beforeEach(() => {
    origStdin = process.stdin.isTTY;
    origStdout = process.stdout.isTTY;
  });
  afterEach(() => {
    (process.stdin as { isTTY?: boolean }).isTTY = origStdin;
    (process.stdout as { isTTY?: boolean }).isTTY = origStdout;
  });

  test('true only when both are TTYs', () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = true;
    expect(isInteractiveTTY()).toBe(true);
  });

  test('false when stdin not TTY', () => {
    (process.stdin as { isTTY?: boolean }).isTTY = false;
    (process.stdout as { isTTY?: boolean }).isTTY = true;
    expect(isInteractiveTTY()).toBe(false);
  });

  test('false when stdout not TTY', () => {
    (process.stdin as { isTTY?: boolean }).isTTY = true;
    (process.stdout as { isTTY?: boolean }).isTTY = false;
    expect(isInteractiveTTY()).toBe(false);
  });
});

describe('pickAction', () => {
  afterEach(() => resetPromptRunner());

  test('invokes runner with list question, returns chosen id', async () => {
    const calls: Array<ReadonlyArray<Record<string, unknown>>> = [];
    const runner: PromptRunner = async (questions) => {
      calls.push(questions);
      return { action: 'Submit' };
    };
    setPromptRunner(runner);

    const id = await pickAction([
      { id: 'Submit', label: 'Submit' },
      { id: 'Cancel', label: 'Cancel' },
    ]);
    expect(id).toBe('Submit');
    expect(calls).toHaveLength(1);
    const q = calls[0]![0]!;
    expect(q.type).toBe('list');
    expect(q.name).toBe('action');
    expect((q.choices as Array<{ value: string }>).map((c) => c.value)).toEqual(['Submit', 'Cancel']);
  });

  test('re-throws USER_CANCELLED on ExitPromptError', async () => {
    setPromptRunner(async () => {
      const err = new Error('cancelled') as Error & { name: string };
      err.name = 'ExitPromptError';
      throw err;
    });
    await expect(pickAction([{ id: 'Submit', label: 'Submit' }])).rejects.toMatchObject({
      code: 'USER_CANCELLED',
    });
  });
});

describe('promptFields', () => {
  afterEach(() => resetPromptRunner());

  test('one question per field, returns answer record keyed by fieldId', async () => {
    const capturedQuestions: Array<ReadonlyArray<Record<string, unknown>>> = [];
    const runner: PromptRunner = async (questions) => {
      capturedQuestions.push(questions);
      return { name: 'Alice', age: 30, agreed: true };
    };
    setPromptRunner(runner);

    const answers = await promptFields([
      { fieldId: 'name', label: 'Name', type: 'text', required: true },
      { fieldId: 'age', label: 'Age', type: 'number', required: true },
      { fieldId: 'agreed', label: 'Agreed', type: 'boolean', required: true },
    ]);
    expect(answers).toEqual({ name: 'Alice', age: 30, agreed: true });
    expect(capturedQuestions).toHaveLength(1);
    const qs = capturedQuestions[0]!;
    expect(qs[0]).toMatchObject({ type: 'input', name: 'name' });
    expect(qs[1]).toMatchObject({ type: 'number', name: 'age' });
    expect(qs[2]).toMatchObject({ type: 'confirm', name: 'agreed' });
  });

  test('USER_CANCELLED on ExitPromptError', async () => {
    setPromptRunner(async () => {
      const err = new Error('cancelled') as Error & { name: string };
      err.name = 'ExitPromptError';
      throw err;
    });
    await expect(
      promptFields([{ fieldId: 'x', label: 'X', type: 'text', required: true }]),
    ).rejects.toMatchObject({ code: 'USER_CANCELLED' });
  });
});

describe('confirmSubmit', () => {
  afterEach(() => resetPromptRunner());

  test('returns the boolean answer and writes body to stderr', async () => {
    const stderrWrites: string[] = [];
    const spy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderrWrites.push(String(chunk));
      return true;
    });

    try {
      setPromptRunner(async () => ({ confirmed: true }));
      const result = await confirmSubmit({ content: { name: 'Alice' } });
      expect(result).toBe(true);
      expect(stderrWrites.join('')).toContain('"name": "Alice"');
    } finally {
      spy.mockRestore();
    }

    setPromptRunner(async () => ({ confirmed: false }));
    expect(await confirmSubmit({ content: { name: 'Alice' } })).toBe(false);
  });

  test('USER_CANCELLED on ExitPromptError', async () => {
    setPromptRunner(async () => {
      const err = new Error('cancelled') as Error & { name: string };
      err.name = 'ExitPromptError';
      throw err;
    });
    await expect(confirmSubmit({ content: {} })).rejects.toMatchObject({
      code: 'USER_CANCELLED',
    });
  });
});
