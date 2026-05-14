import { Args, Flags } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { composeMutationBody, type MutationBodyFlags } from '../../lib/input.js';
import { isInteractiveTTY } from '../../lib/interactive.js';
import { stderr } from '../../lib/output.js';
import type { NormalizedError } from '../../lib/errors.js';

function invalidArgs(message: string): NormalizedError {
  return { code: 'INVALID_ARGS', message, httpStatus: 0 };
}

export default class AssignmentsPerform extends BaseCommand {
  static override description = 'Perform an assignment action (auto-fetches eTag)';
  static override examples = [
    '<%= config.bin %> assignments perform ASSIGN-1 --action Submit --data @form.json',
    '<%= config.bin %> assignments perform ASSIGN-1 --interactive',
  ];
  static override args = {
    assignmentId: Args.string({ required: true, description: 'Assignment ID' }),
  };
  static override flags = {
    action: Flags.string({ description: 'Action ID (required unless --interactive)' }),
    data: Flags.string({ description: 'JSON content (inline, @file, or -)' }),
    'page-instructions': Flags.string({
      description: 'JSON page-instructions array (inline, @file, or -)',
    }),
    attachments: Flags.string({
      description: 'JSON attachments array (inline, @file, or -)',
    }),
    interactive: Flags.boolean({
      description: 'Walk through action + required fields via prompts (TTY only)',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssignmentsPerform);
    const baseFlags = flags as unknown as BaseFlags;

    if (flags.interactive) {
      if (!isInteractiveTTY()) {
        stderr('--interactive flag ignored: stdin is not a TTY', { quiet: baseFlags.quiet });
      } else {
        const conflicting: string[] = [];
        if (flags.action) conflicting.push('--action');
        if (flags.data) conflicting.push('--data');
        if (flags['page-instructions']) conflicting.push('--page-instructions');
        if (flags.attachments) conflicting.push('--attachments');
        if (conflicting.length > 0) {
          this.fail(invalidArgs(
            `--interactive cannot be combined with ${conflicting.join(', ')}`,
          ));
        }
        if (baseFlags['dry-run']) {
          this.fail(invalidArgs('--interactive cannot be combined with --dry-run'));
        }

        await this.runInteractive(args.assignmentId, baseFlags);
        return;
      }
    }

    if (!flags.action) {
      this.fail(invalidArgs('Missing required flag: --action'));
    }

    let body: Record<string, unknown> = {};
    try {
      body = await composeMutationBody(flags as MutationBodyFlags, 'action');
    } catch (err) {
      this.fail(err);
    }
    const encId = encodeURIComponent(args.assignmentId);
    const encAction = encodeURIComponent(flags.action);
    await this.runMutateWithEtag(
      baseFlags,
      'PATCH',
      `/assignments/${encId}`,
      `/assignments/${encId}/actions/${encAction}`,
      body,
    );
  }

  // Wizard implementation lands in Task 5.
  protected async runInteractive(_assignmentId: string, _baseFlags: BaseFlags): Promise<void> {
    this.fail(invalidArgs('Interactive wizard not yet implemented'));
  }
}
