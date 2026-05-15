import { Args } from '@oclif/core';
import { BaseCommand, type BaseFlags } from '../../base-command.js';
import { getConfig } from '../../lib/config.js';
import { type NormalizedError } from '../../lib/errors.js';

interface CaseTypeEntry {
  ID?: string;
  name?: string;
  [key: string]: unknown;
}

interface CaseTypesListResponse {
  caseTypes?: CaseTypeEntry[];
  [key: string]: unknown;
}

export const __endpoint = {
  path: '/casetypes',
  method: 'GET',
} as const;

export default class CaseTypesGet extends BaseCommand {
  static override description = 'Get full details of a specific case type (filters the case-types list response)';
  static override examples = ['<%= config.bin %> case-types get Uplus-FS-Work-ProductComplaint'];
  static override args = {
    caseTypeId: Args.string({ required: true, description: 'Case type ID' }),
  };

  // Pega DX V2 has no GET /casetypes/{id} endpoint; the case-types list response includes
  // every type's full detail inline. This command fetches the list and filters by ID.
  async run(): Promise<void> {
    const { args, flags } = await this.parse(CaseTypesGet);
    const baseFlags = flags as unknown as BaseFlags;

    if (baseFlags['dry-run']) {
      const cfg = getConfig(baseFlags.profile);
      this.emitDryRun({
        method: 'GET',
        url: `${cfg.baseUrl}/prweb/api/application/v2/casetypes`,
        headers: { Authorization: 'Bearer <token>', 'x-origin-channel': 'Web' },
      });
      return;
    }

    try {
      const client = await this.getClient(baseFlags);
      const list = await client.get<CaseTypesListResponse>('/casetypes');
      const match = list.caseTypes?.find((ct) => ct.ID === args.caseTypeId);
      if (!match) {
        throw {
          code: 'NOT_FOUND',
          message: `Case type '${args.caseTypeId}' not found in /casetypes response`,
          httpStatus: 404,
        } satisfies NormalizedError;
      }
      this.emit(match, baseFlags);
    } catch (err) {
      this.fail(err);
    }
  }
}
