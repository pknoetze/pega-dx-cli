import { vol } from 'memfs';

export function resetMockFs(): void {
  vol.reset();
}

export function seedFile(path: string, content: string): void {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  let dir = '';
  for (const part of parts) {
    dir += '/' + part;
    vol.mkdirSync(dir, { recursive: true });
  }
  vol.writeFileSync(path, content);
}

export function readMockFile(path: string): string {
  return vol.readFileSync(path, 'utf-8') as string;
}

export function mockFileStat(path: string): { mode: number } | null {
  try {
    const s = vol.statSync(path);
    return { mode: s.mode };
  } catch {
    return null;
  }
}
