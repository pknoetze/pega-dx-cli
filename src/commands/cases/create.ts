import { Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { readDataFlag } from '../../lib/input.js';

export default class CasesCreate extends BaseCommand {
  static override description = 'Create a new Pega case (V2)';
  static override examples = [
    '<%= config.bin %> cases create --type InsuranceClaim',
    '<%= config.bin %> cases create --type InsuranceClaim --data @claim.json',
  ];
  static override flags = {
    type: Flags.string({ required: true, description: 'Case type ID' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or - for stdin)' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(CasesCreate);
    const baseFlags = flags as unknown as BaseFlags;

    let content: unknown = undefined;
    if (flags.data) {
      try {
        content = await readDataFlag(flags.data);
      } catch (err) {
        this.fail(err);
      }
    }

    const body: Record<string, unknown> = { caseTypeID: flags.type };
    if (content !== undefined) body.content = content;

    const cfg = getConfig(baseFlags.profile);
    const url = `${cfg.baseUrl}/prweb/api/application/v2/cases`;

    if (baseFlags['dry-run']) {
      this.emitDryRun({
        method: 'POST',
        url,
        headers: {
          Authorization: 'Bearer <token>',
          'Content-Type': 'application/json',
          'x-origin-channel': 'Web',
        },
        body,
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const result = await client.post('/cases', body);
      this.emit(result, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
