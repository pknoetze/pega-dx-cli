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
