import * as fs from 'node:fs';
import type { NormalizedError } from './errors.js';

function invalidArgs(message: string): NormalizedError {
  return { code: 'INVALID_ARGS', message, httpStatus: 0 };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export async function parseDataInput(value: string): Promise<unknown> {
  let raw: string;
  if (value === '-') {
    raw = await readStdin();
  } else if (value.startsWith('@')) {
    try {
      raw = fs.readFileSync(value.slice(1), 'utf-8') as string;
    } catch (err) {
      throw invalidArgs(`Cannot read data file ${value.slice(1)}: ${(err as Error).message}`);
    }
  } else {
    raw = value;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw invalidArgs(`Invalid JSON in --data: ${(err as Error).message}`);
  }
}
