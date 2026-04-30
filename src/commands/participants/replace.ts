import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class ParticipantsReplace extends BaseCommand {
  static override description = 'Replace all participants in a given role';
  static override examples = [
    '<%= config.bin %> participants replace MYAPP-CASE-1 --role Reviewer --data @reviewers.json',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role' }),
    data: Flags.string({ required: true, description: 'JSON content (inline, @file, or -)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsReplace);
    const baseFlags = flags as unknown as BaseFlags;
    let body: unknown;
    try {
      body = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    // TODO: verify path and method against real Pega in Task 13 — MCP does not implement replace_case_participants
    const encCaseId = encodeURIComponent(args.caseId);
    const encRole = encodeURIComponent(flags.role);
    await this.runMutateWithEtag(
      baseFlags,
      'PUT',
      `/cases/${encCaseId}`,
      `/cases/${encCaseId}/participants/${encRole}`,
      body,
    );
  }
}
