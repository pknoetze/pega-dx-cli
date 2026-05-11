import { BaseCommand, type BaseFlags } from '../../base-command.js';

export default class AiAgentsList extends BaseCommand {
  static override description = 'Fetch all AI agents enabled for external access';
  static override examples = ['<%= config.bin %> ai-agents list'];
  static override args = {};
  static override flags = {};

  async run(): Promise<void> {
    const { flags } = await this.parse(AiAgentsList);
    const baseFlags = flags as unknown as BaseFlags;
    await this.runGet(baseFlags, '/ai-agents');
  }
}
