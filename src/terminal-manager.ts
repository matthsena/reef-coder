import { spawn, type ChildProcess } from 'node:child_process';

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB cap on captured output

interface ManagedTerminal {
  process: ChildProcess;
  output: string;
  outputTruncated: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  exited: boolean;
  exitPromise: Promise<void>;
}

export class TerminalManager {
  private terminals = new Map<string, ManagedTerminal>();
  private counter = 0;

  create(command: string, args: string[], cwd: string): string {
    const id = `term-${++this.counter}`;
    const proc = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const { promise: exitPromise, resolve } = Promise.withResolvers<void>();

    const terminal: ManagedTerminal = {
      process: proc,
      output: '',
      outputTruncated: false,
      exitCode: null,
      signal: null,
      exited: false,
      exitPromise,
    };

    for (const stream of [proc.stdout, proc.stderr]) {
      stream?.on('data', (chunk: Buffer) => {
        if (terminal.outputTruncated) return;
        const text = chunk.toString();
        if (terminal.output.length + text.length > MAX_OUTPUT_BYTES) {
          terminal.output += text.slice(0, MAX_OUTPUT_BYTES - terminal.output.length);
          terminal.outputTruncated = true;
        } else {
          terminal.output += text;
        }
      });
    }
    proc.on('exit', (code, signal) => {
      terminal.exitCode = code;
      terminal.signal = signal;
      terminal.exited = true;
      resolve();
    });

    this.terminals.set(id, terminal);
    return id;
  }

  private get(id: string): ManagedTerminal {
    const terminal = this.terminals.get(id);
    if (!terminal) throw new Error(`Terminal ${id} not found`);
    return terminal;
  }

  getOutput(id: string) {
    const t = this.get(id);
    return {
      output: t.output,
      truncated: t.outputTruncated,
      ...(t.exited
        ? { exitStatus: { exitCode: t.exitCode, signal: t.signal } }
        : {}),
    };
  }

  async waitForExit(id: string) {
    const t = this.get(id);
    await t.exitPromise;
    return { exitCode: t.exitCode, signal: t.signal };
  }

  kill(id: string): void {
    this.get(id).process.kill('SIGTERM');
  }

  async release(id: string): Promise<void> {
    const t = this.terminals.get(id);
    if (!t) return;
    if (!t.exited) {
      t.process.kill('SIGTERM');
      const timeout = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 5000));
      const result = await Promise.race([t.exitPromise.then(() => 'exited' as const), timeout]);
      if (result === 'timeout' && !t.exited) {
        t.process.kill('SIGKILL');
        await t.exitPromise;
      }
    }
    this.terminals.delete(id);
  }
}
