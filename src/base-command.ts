import { Command, Flags, type Interfaces } from '@oclif/core';
import { createPegaApiClient, type PegaApiClient } from './lib/api-client.js';
import { getConfig, getToken } from './lib/config.js';
import { stdout, stderr, error, dryRun, type DryRunRequest } from './lib/output.js';
import { isNormalizedError, type NormalizedError } from './lib/errors.js';

export type BaseFlags = Interfaces.InferredFlags<typeof BaseCommand.baseFlags>;

export abstract class BaseCommand extends Command {
  static override baseFlags = {
    format: Flags.string({
      description: 'Output format (json, compact)',
      options: ['json', 'compact'],
      default: 'json',
    }),
    fields: Flags.string({
      description: 'Comma-separated top-level fields to include in output',
    }),
    'dry-run': Flags.boolean({
      description: 'Print HTTP request details and exit without executing',
      default: false,
    }),
    quiet: Flags.boolean({
      description: 'Suppress all stderr progress/warning output',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Emit full HTTP request/response details to stderr',
      default: false,
    }),
    'no-cache': Flags.boolean({
      description: 'Bypass token file cache; perform fresh OAuth exchange',
      default: false,
    }),
    profile: Flags.string({
      description: 'Named config profile',
      default: 'default',
    }),
  };

  protected async getClient(flags: BaseFlags): Promise<PegaApiClient> {
    const cfg = getConfig(flags.profile);
    const noCache = flags['no-cache'];
    return createPegaApiClient({
      baseUrl: cfg.baseUrl,
      tokenProvider: async () => {
        const token = await getToken({ noCache, profile: flags.profile });
        return token.accessToken;
      },
      onVerbose: flags.verbose
        ? (req, res) => {
            stderr(`→ ${req.method} ${req.url}`, { quiet: flags.quiet });
            stderr(`← ${res.status}`, { quiet: flags.quiet });
          }
        : undefined,
    });
  }

  protected emit(data: unknown, flags: BaseFlags): void {
    stdout(data, { format: flags.format as 'json' | 'compact', fields: flags.fields });
  }

  protected emitDryRun(req: DryRunRequest): void {
    dryRun(req);
  }

  protected fail(err: unknown): never {
    const normalized: NormalizedError = isNormalizedError(err)
      ? err
      : { code: 'UNKNOWN', message: (err as Error).message ?? 'Unknown error', httpStatus: 0 };
    error(normalized);
    this.exit(1);
  }

  override async catch(err: Error & { oclif?: { exit?: number } }): Promise<never> {
    if (err.oclif?.exit !== undefined) throw err;
    this.fail(err);
  }
}
