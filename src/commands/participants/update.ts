import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';

export default class ParticipantsUpdate extends BaseCommand {
  static override description = "Update a participant's details";
  static override examples = [
    "<%= config.bin %> participants update MYAPP-CASE-1 --participant-id PEGA-PART-X --data '{\"email\":\"a@b.com\"}'",
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    'participant-id': Flags.string({
      required: true,
      description: 'Participant instance ID',
    }),
    data: Flags.string({
      description: 'JSON content (inline, @file, or -)',
    }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsUpdate);
    const baseFlags = flags as unknown as BaseFlags;
    let body: Record<string, unknown> = {};
    try {
      // participants PATCH uses action body shape: content + pageInstructions + attachments
      body = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
    }
    const encCaseId = encodeURIComponent(args.caseId);
    const encPartId = encodeURIComponent(flags['participant-id']);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/cases/${encCaseId}`,
      `/cases/${encCaseId}/participants/${encPartId}`,
      body,
    );
  }
}
