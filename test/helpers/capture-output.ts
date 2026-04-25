export interface CapturedOutput {
  stdout: string[];
  stderr: string[];
  restore: () => void;
}

export function captureOutput(): CapturedOutput {
  const stdoutWrites: string[] = [];
  const stderrWrites: string[] = [];
  const origStdout = process.stdout.write.bind(process.stdout);
  const origStderr = process.stderr.write.bind(process.stderr);

  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdoutWrites.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }) as typeof process.stdout.write;

  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderrWrites.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }) as typeof process.stderr.write;

  return {
    stdout: stdoutWrites,
    stderr: stderrWrites,
    restore() {
      process.stdout.write = origStdout;
      process.stderr.write = origStderr;
    },
  };
}

/**
 * Parse the first JSON object found in stderr output. Skips Node deprecation
 * warning lines that oclif's CLIError emission may inject under Jest's VM
 * sandbox before the actual structured error JSON.
 */
export function parseFirstJson(lines: string[]): unknown {
  const text = lines.join('');
  // Find the first '{' that begins a parseable JSON object.
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    for (let j = text.length; j > i; j--) {
      const slice = text.slice(i, j);
      try {
        return JSON.parse(slice);
      } catch {
        /* keep narrowing */
      }
    }
  }
  throw new Error('No JSON object found in output');
}
