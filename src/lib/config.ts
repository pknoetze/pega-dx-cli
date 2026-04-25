import * as fs from 'node:fs';
import * as path from 'node:path';
import { fromHttpResponse, fromNetworkError, type NormalizedError } from './errors.js';

export interface PegaConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  profile: string;
}

export interface TokenResult {
  accessToken: string;
  expiresAt: string;
}

interface FileConfigShape {
  profiles?: Record<string, Partial<Omit<PegaConfig, 'profile'>>>;
}

interface TokenFileShape {
  [profile: string]: { accessToken: string; expiresAt: string };
}

const REFRESH_BUFFER_MS = 60_000;

function homeDir(): string {
  const dir = process.env.HOME ?? process.env.USERPROFILE;
  if (!dir) {
    throw {
      code: 'INVALID_CONFIG',
      message: 'Cannot determine home directory (HOME / USERPROFILE unset)',
      httpStatus: 0,
    } satisfies NormalizedError;
  }
  return dir;
}

function configDir(): string {
  return path.join(homeDir(), '.pega-cli');
}
function configPath(): string {
  return path.join(configDir(), 'config.json');
}
function tokenPath(): string {
  return path.join(configDir(), 'token.json');
}

function invalidConfig(message: string): NormalizedError {
  return { code: 'INVALID_CONFIG', message, httpStatus: 0 };
}

function stripPrweb(url: string): string {
  return url.replace(/\/prweb.*$/, '');
}

function readFileConfig(): FileConfigShape {
  try {
    const contents = fs.readFileSync(configPath(), 'utf-8');
    return JSON.parse(contents);
  } catch {
    return {};
  }
}

export function getConfig(profile = 'default'): PegaConfig {
  const fileCfg = readFileConfig();
  const profileCfg = fileCfg.profiles?.[profile] ?? {};
  const baseUrlRaw =
    process.env.PEGA_BASE_URL ?? profileCfg.baseUrl ?? undefined;
  const clientId = process.env.PEGA_CLIENT_ID ?? profileCfg.clientId ?? undefined;
  const clientSecret =
    process.env.PEGA_CLIENT_SECRET ?? profileCfg.clientSecret ?? undefined;

  if (!baseUrlRaw) throw invalidConfig('PEGA_BASE_URL is not set');
  if (!clientId) throw invalidConfig('PEGA_CLIENT_ID is not set');
  if (!clientSecret) throw invalidConfig('PEGA_CLIENT_SECRET is not set');

  return {
    baseUrl: stripPrweb(baseUrlRaw),
    clientId,
    clientSecret,
    profile,
  };
}

function readTokenFile(): TokenFileShape {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(tokenPath(), 'utf-8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as TokenFileShape;
    }
  } catch {
    /* ignore parse / ENOENT */
  }
  return {};
}

function writeTokenFile(data: TokenFileShape): void {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tokenPath(), JSON.stringify(data, null, 2), { mode: 0o600 });
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(tokenPath(), 0o600);
    } catch {
      /* chmod may not be supported on all filesystems */
    }
  }
}

function isNoCache(noCache: boolean): boolean {
  return noCache || process.env.PEGA_NO_CACHE === 'true';
}

async function fetchToken(cfg: PegaConfig): Promise<TokenResult> {
  const url = `${cfg.baseUrl}/prweb/PRRestService/oauth2/v1/token`;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: 'grant_type=client_credentials',
    });
  } catch (err) {
    throw fromNetworkError(err as Error);
  }

  if (!response.ok) {
    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      /* ignore parse errors */
    }
    throw fromHttpResponse(response, body);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw {
      code: 'OAUTH_INVALID_RESPONSE',
      message: 'OAuth response missing access_token',
      httpStatus: response.status,
    } satisfies NormalizedError;
  }
  const expiresIn = data.expires_in ?? 3600;
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

export async function getToken(opts: {
  noCache: boolean;
  profile: string;
  forceFresh?: boolean;
}): Promise<TokenResult> {
  const noCache = isNoCache(opts.noCache);
  const cfg = getConfig(opts.profile);

  if (!noCache && !opts.forceFresh) {
    const store = readTokenFile();
    const cached = store[opts.profile];
    if (cached) {
      const remaining = new Date(cached.expiresAt).getTime() - Date.now();
      if (remaining > REFRESH_BUFFER_MS) {
        return cached;
      }
    }
  }

  const fresh = await fetchToken(cfg);

  if (!noCache) {
    const store = readTokenFile();
    store[opts.profile] = fresh;
    writeTokenFile(store);
  }

  return fresh;
}

export function clearToken(profile: string): void {
  const store = readTokenFile();
  if (!store[profile]) return;
  delete store[profile];
  writeTokenFile(store);
}
