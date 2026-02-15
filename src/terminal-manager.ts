import { spawn, type ChildProcess } from 'node:child_process';

interface ManagedTerminal {
  process: ChildProcess;
  output: string;
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
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const { promise: exitPromise, resolve } = Promise.withResolvers<void>();

    const terminal: ManagedTerminal = {
      process: proc,
      output: '',
      exitCode: null,
      signal: null,
      exited: false,
      exitPromise,
    };

    for (const stream of [proc.stdout, proc.stderr]) {
      stream?.on('data', (chunk: Buffer) => { terminal.output += chunk.toString(); });
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
      truncated: false,
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

  release(id: string): void {
    const t = this.terminals.get(id);
    if (!t) return;
    if (!t.exited) t.process.kill('SIGTERM');
    this.terminals.delete(id);
  }
}
