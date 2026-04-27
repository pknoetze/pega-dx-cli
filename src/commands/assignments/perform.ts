import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { parseDataInput } from '../../lib/input.js';
import { type NormalizedError } from '../../lib/errors.js';

export default class AssignmentsPerform extends BaseCommand {
  static override description = 'Perform an action on an assignment (PATCH with If-Match eTag)';
  static override examples = [
    '<%= config.bin %> assignments perform ASSIGN-WORKLIST X-1!FLOW --action Submit',
    '<%= config.bin %> assignments perform ASSIGN-WORKLIST X-1!FLOW --action Submit --data @form.json',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Full assignment handle' }),
  };
  static override flags = {
    action: Flags.string({ required: true, description: 'Flow action ID (e.g., Submit)' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsPerform);
    const baseFlags = flags as unknown as BaseFlags;

    let content: unknown;
    if (flags.data) {
      try {
        content = await parseDataInput(flags.data);
      } catch (err) {
        this.fail(err);
      }
    }

    const body: Record<string, unknown> = {};
    if (content !== undefined) body.content = content;

    const cfg = getConfig(baseFlags.profile);
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    const path = `/assignments/${encId}/actions/${encAction}`;
    const url = `${cfg.baseUrl}/prweb/api/application/v2${path}`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'PATCH',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'Content-Type': 'application/json',
          'If-Match': '<etag-from-GET>',
          'x-origin-channel': 'Web',
        },
        body,
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      // Fetch eTag first — Pega requires If-Match on the PATCH.
      const meta = await client.getWithMeta(`/assignments/${encId}`);
      const eTag = meta.eTag;
      if (!eTag) {
        throw {
          code: 'MISSING_ETAG',
          message: 'Assignment response did not include an ETag header',
          httpStatus: meta.status,
        } satisfies NormalizedError;
      }
      const result = await client.patch(path, body, {
        extraHeaders: { 'If-Match': eTag },
      });
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
