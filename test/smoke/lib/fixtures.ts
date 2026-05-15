import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SmokeFixtures } from './types.js';

export function loadFixtures(): SmokeFixtures {
  const candidates = [
    path.resolve(process.cwd(), 'test/smoke/fixtures.json'),
    path.resolve(process.cwd(), 'test/smoke/fixtures.example.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      if (p.endsWith('.example.json')) {
        console.warn(
          `[smoke] WARNING: using placeholder fixtures from ${p}. Real smoke runs need test/smoke/fixtures.json.`,
        );
      }
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      return raw as SmokeFixtures;
    }
  }
  throw new Error('No fixtures.json or fixtures.example.json found under test/smoke/');
}
