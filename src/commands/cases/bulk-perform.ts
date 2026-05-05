import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';
import { getConfig } from '../../lib/config.js';
import type { NormalizedError } from '../../lib/errors.js';

// Bypasses runMutateWithEtag: bulk endpoint does NOT require If-Match (PDF p.329).
// Custom 207/202 response handling lives inline.
export default class CasesBulkPerform extends BaseCommand {
  static override description = 'Perform an action across multiple cases in a single API call';
  static override examples = [
    '<%= config.bin %> cases bulk-perform --action Approve --cases CASE-1,CASE-2,CASE-3',
    "<%= config.bin %> cases bulk-perform --action Approve --cases CASE-1,CASE-2 --data '{\"reason\":\"OK\"}'",
  ];
  static override flags = {
    action: Flags.string({ required: true, description: 'Case action ID' }),
    cases: Flags.string({
      required: true,
      description: 'Comma-separated case IDs',
    }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
    'running-mode': Flags.string({
      description: 'Launchpad-only: async (returns 202 with jobID)',
      options: ['async'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CasesBulkPerform);
    const baseFlags = flags as unknown as BaseFlags;
    const cfg = getConfig(flags.profile);

    const ids = flags.cases.split(',').map((s) => s.trim()).filter(Boolean);
    let actionBody: Record<string, unknown> = {};
    try {
      actionBody = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
    }
    const body: Record<string, unknown> = {
      cases: ids.map((ID) => ({ ID })),
      ...actionBody,
    };

    const params = new URLSearchParams({ actionID: flags.action });
    if (flags['running-mode']) params.set('runningMode', flags['running-mode']);
    const path = `/cases?${params.toString()}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (flags['dry-run']) {
      this.emitDryRun({
        method: 'PATCH',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'x-origin-channel': 'Web',
          'Content-Type': 'application/json',
        },
        body,
      });
      return;
    }

    let data: unknown;
    try {
      const client = await this.getClient(baseFlags);
      // client.patch returns the parsed body only; distinguish 207 vs 202 by shape.
      data = await client.patch(path, body);
    } catch (err) {
      this.fail(err);
    }

    // Distinguish 207 (array) vs 202 (object with jobID).
    if (Array.isArray(data)) {
      // Sync 207 multistatus.
      this.emit(data, baseFlags);
      const anyFailed = data.some(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'status' in item &&
          typeof (item as { status: number }).status === 'number' &&
          (item as { status: number }).status >= 400,
      );
      if (anyFailed) {
        const err: NormalizedError = {
          code: 'BULK_PARTIAL_FAILURE',
          message: 'One or more cases failed',
          httpStatus: 207,
        };
        this.fail(err);
      }
      return;
    }
    // Async 202 jobID (or any non-array success body).
    this.emit(data, baseFlags);
  }
}
