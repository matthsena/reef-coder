import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import type * as acp from '@agentclientprotocol/sdk';
import type { TerminalManager } from './terminal-manager.ts';
import type { SessionStore } from './store.ts';

export class AgentClient implements acp.Client {
  constructor(
    private terminals: TerminalManager,
    private workdir: string,
    private store: SessionStore,
  ) {}

  private async resolveWithinWorkdir(targetPath: string): Promise<string> {
    const resolved = resolve(this.workdir, targetPath);
    if (resolved !== this.workdir && !resolved.startsWith(this.workdir + '/')) {
      throw new Error(
        `Access denied: ${resolved} is outside workdir ${this.workdir}`,
      );
    }
    // Follow symlinks to prevent directory traversal escape
    try {
      const real = await realpath(resolved);
      if (real !== this.workdir && !real.startsWith(this.workdir + '/')) {
        throw new Error(
          `Access denied: ${real} resolves outside workdir ${this.workdir}`,
        );
      }
      return real;
    } catch (err: unknown) {
      // Path component doesn't exist yet (e.g. new files or parent dirs) — resolve check is sufficient
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') return resolved;
      throw err;
    }
  }

  async sessionUpdate(params: acp.SessionNotification): Promise<void> {
    const update = params.update;
    if (!update) return;

    try {
      switch (update.sessionUpdate) {
        case 'agent_message_chunk': {
          const content = (update as any).content;
          if (content?.type === 'text') {
            this.store.emit('agent-message-chunk', content.text);
          } else if (content) {
            this.store.emit('agent-message-chunk', `[${content.type}]`);
          }
          break;
        }

        case 'agent_thought_chunk': {
          const content = (update as any).content;
          if (content?.type === 'text') {
            this.store.emit('agent-thought-chunk', content.text);
          }
          break;
        }

        case 'tool_call':
          this.store.emit('tool-call', {
            id: (update as any).toolCallId,
            title: (update as any).title ?? 'tool call',
            status: (update as any).status ?? 'started',
          });
          break;

        case 'tool_call_update':
          this.store.emit(
            'tool-call-update',
            (update as any).toolCallId,
            (update as any).status ?? 'unknown',
          );
          break;

        case 'plan':
          this.store.emit(
            'plan',
            ((update as any).entries ?? []).map((e: any) => ({
              status: e.status,
              content: e.content,
            })),
          );
          break;

        default:
          this.store.emit(
            'connection-status',
            `[debug] unhandled sessionUpdate: ${(update as any).sessionUpdate}`,
          );
          break;
      }
    } catch (err) {
      this.store.emit(
        'agent-message-chunk',
        `\n[sessionUpdate error: ${err instanceof Error ? err.message : String(err)}]\n`,
      );
    }
  }

  async requestPermission(
    params: acp.RequestPermissionRequest,
  ): Promise<acp.RequestPermissionResponse> {
    const option = params.options[0];
    if (!option) {
      return { outcome: { outcome: 'cancelled' } };
    }
    this.store.emit(
      'permission',
      `Auto-accepting: "${option.name}" (${option.kind}) for ${params.toolCall.title}`,
    );
    return {
      outcome: { outcome: 'selected', optionId: option.optionId },
    };
  }

  async readTextFile(
    params: acp.ReadTextFileRequest,
  ): Promise<acp.ReadTextFileResponse> {
    const safePath = await this.resolveWithinWorkdir(params.path);
    const content = await readFile(safePath, 'utf-8');
    return { content };
  }

  async writeTextFile(
    params: acp.WriteTextFileRequest,
  ): Promise<acp.WriteTextFileResponse> {
    const safePath = await this.resolveWithinWorkdir(params.path);
    await writeFile(safePath, params.content, 'utf-8');
    return {};
  }

  async createTerminal(
    params: acp.CreateTerminalRequest,
  ): Promise<acp.CreateTerminalResponse> {
    const safeCwd = await this.resolveWithinWorkdir(params.cwd ?? this.workdir);
    const terminalId = this.terminals.create(
      params.command,
      params.args ?? [],
      safeCwd,
    );
    return { terminalId };
  }

  async terminalOutput(
    params: acp.TerminalOutputRequest,
  ): Promise<acp.TerminalOutputResponse> {
    return this.terminals.getOutput(params.terminalId);
  }

  async waitForTerminalExit(
    params: acp.WaitForTerminalExitRequest,
  ): Promise<acp.WaitForTerminalExitResponse> {
    return this.terminals.waitForExit(params.terminalId);
  }

  async killTerminal(
    params: acp.KillTerminalCommandRequest,
  ): Promise<acp.KillTerminalCommandResponse> {
    this.terminals.kill(params.terminalId);
    return {};
  }

  async releaseTerminal(
    params: acp.ReleaseTerminalRequest,
  ): Promise<acp.ReleaseTerminalResponse> {
    await this.terminals.release(params.terminalId);
    return {};
  }
}
