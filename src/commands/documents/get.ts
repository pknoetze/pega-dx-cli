import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';

export const __endpoint = {
  path: '/documents/{documentID}',
  method: 'GET',
} as const;

export default class DocumentsGet extends BaseCommand {
  static override description = 'Get metadata for a specific document';
  static override examples = ['<%= config.bin %> documents get DOC-1'];
  static override args = {
    documentId: Args.string({ required: true, description: 'Document ID' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DocumentsGet);
    const path = `/documents/${encodeURIComponent(args.documentId)}`;
    await this.runGet(flags as unknown as BaseFlags, path);
  }
}
