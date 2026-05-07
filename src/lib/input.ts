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

export async function parseDataInput(value: string, flagName = '--data'): Promise<unknown> {
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
    throw invalidArgs(`Invalid JSON in ${flagName}: ${(err as Error).message}`);
  }
}

export interface MutationBodyFlags {
  data?: string;
  'page-instructions'?: string;
  attachments?: string;
  'interest-page'?: string;
  'interest-page-action-id'?: string;
}

export type MutationBodyShape = 'action' | 'refresh' | 'navigate';

export async function composeMutationBody(
  flags: MutationBodyFlags,
  shape: MutationBodyShape,
): Promise<Record<string, unknown>> {
  if (shape === 'refresh' && flags.attachments !== undefined) {
    throw invalidArgs(
      'refresh body does not accept --attachments (only content, pageInstructions, interestPage, interestPageActionID)',
    );
  }

  const body: Record<string, unknown> = {};

  if (flags.data !== undefined) {
    body.content = await parseDataInput(flags.data, '--data');
  }
  if (flags['page-instructions'] !== undefined) {
    body.pageInstructions = await parseDataInput(flags['page-instructions'], '--page-instructions');
  }
  if (shape !== 'refresh' && flags.attachments !== undefined) {
    body.attachments = await parseDataInput(flags.attachments, '--attachments');
  }
  // interestPage/interestPageActionID are only meaningful for 'refresh' bodies.
  // Other shapes simply do not surface these flags in their commands.
  if (shape === 'refresh' && flags['interest-page'] !== undefined) {
    body.interestPage = flags['interest-page'];
  }
  if (shape === 'refresh' && flags['interest-page-action-id'] !== undefined) {
    body.interestPageActionID = flags['interest-page-action-id'];
  }

  return body;
}

export interface DataQueryBodyFlags {
  data?: string;
  params?: string;
  max?: number;
  page?: number;
  'include-total'?: boolean;
}

export type DataQueryBodyShape = 'query' | 'count-or-metadata';

export async function composeDataQueryBody(
  flags: DataQueryBodyFlags,
  shape: DataQueryBodyShape,
): Promise<Record<string, unknown>> {
  const hasPagingFlags =
    flags.max !== undefined || flags.page !== undefined || flags['include-total'] !== undefined;

  // count-or-metadata rejects paging flags entirely
  if (shape === 'count-or-metadata' && hasPagingFlags) {
    throw invalidArgs('paging flags (--max, --page, --include-total) are not valid for this command');
  }

  const hasSimpleFlags = flags.params !== undefined || hasPagingFlags;

  // --data is mutually exclusive with simple flags
  if (flags.data !== undefined && hasSimpleFlags) {
    throw invalidArgs('--data is mutually exclusive with --params/--max/--page/--include-total');
  }

  // --data only: return parsed body verbatim
  if (flags.data !== undefined) {
    return (await parseDataInput(flags.data, '--data')) as Record<string, unknown>;
  }

  // Compose from simple flags
  const body: Record<string, unknown> = {};

  if (flags.params !== undefined) {
    body.dataViewParameters = await parseDataInput(flags.params, '--params');
  }

  if (shape === 'query' && hasPagingFlags) {
    const paging: Record<string, unknown> = {};
    if (flags.max !== undefined) paging.maxResultsToFetch = flags.max;
    if (flags.page !== undefined) paging.pageNumber = flags.page;
    if (flags['include-total'] !== undefined) paging.includeTotalCount = flags['include-total'];
    body.paging = paging;
  }

  return body;
}
