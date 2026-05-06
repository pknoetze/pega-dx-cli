import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { parseDataInput } from '../../lib/input.js';

export default class ParticipantsAdd extends BaseCommand {
  static override description = 'Add a participant to a case in a given role';
  static override examples = [
    '<%= config.bin %> participants add MYAPP-CASE-1 --role Customer --data \'{"pyFirstName":"Jane","pyLastName":"Doe","pyEmail1":"jane@example.com","pyPhoneNumber":""}\'',
  ];
  static override args = {
    caseId: Args.string({ required: true, description: 'Case ID' }),
  };
  static override flags = {
    role: Flags.string({ required: true, description: 'Participant role ID (e.g. Customer, Owner)' }),
    data: Flags.string({
      required: true,
      description:
        'JSON content page: {pyFirstName,pyLastName,pyEmail1,pyPhoneNumber,...} (inline, @file, or -)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ParticipantsAdd);
    const baseFlags = flags as unknown as BaseFlags;
    let content: unknown = undefined;
    try {
      content = await parseDataInput(flags.data);
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.caseId);
    await this.runMutateWithEtag(
      baseFlags,
      'POST',
      `/cases/${encId}`,
      `/cases/${encId}/participants`,
      { participantRoleID: flags.role, content },
    );
  }
}
