import { readFile, writeFile } from 'node:fs/promises';
import type * as acp from '@agentclientprotocol/sdk';
import type { TerminalManager } from './terminal-manager.ts';
const ESC = '\x1b[';
const fmt = (code: string) => (s: string) => `${ESC}${code}m${s}${ESC}0m`;
const dim = fmt('2');
const cyan = fmt('36');
const yellow = fmt('33');

export class CopilotClient implements acp.Client {
  constructor(private terminals: TerminalManager) {}

  async sessionUpdate(params: acp.SessionNotification): Promise<void> {
    const update = params.update;

    switch (update.sessionUpdate) {
      case 'agent_message_chunk':
        process.stdout.write(
          update.content.type === 'text'
            ? update.content.text
            : `[${update.content.type}]`,
        );
        break;

      case 'agent_thought_chunk':
        if (update.content.type === 'text') {
          process.stdout.write(dim(update.content.text));
        }
        break;

      case 'tool_call':
        console.log(
          `\n${cyan(`[tool] ${update.title} (${update.status ?? 'started'})`)}`,
        );
        break;

      case 'tool_call_update':
        console.log(
          cyan(`[tool update] ${update.toolCallId}: ${update.status ?? 'unknown'}`),
        );
        break;

      case 'plan':
        console.log(`\n${yellow('[plan]')}`);
        for (const entry of update.entries) {
          console.log(`  [${entry.status}] ${entry.content}`);
        }
        break;
    }
  }

  async requestPermission(
    params: acp.RequestPermissionRequest,
  ): Promise<acp.RequestPermissionResponse> {
    const option = params.options[0]!;
    console.log(
      `\n${yellow(`[permission] auto-accepting: "${option.name}" (${option.kind}) for ${params.toolCall.title}`)}`,
    );
    return {
      outcome: { outcome: 'selected', optionId: option.optionId },
    };
  }

  async readTextFile(
    params: acp.ReadTextFileRequest,
  ): Promise<acp.ReadTextFileResponse> {
    const content = await readFile(params.path, 'utf-8');
    return { content };
  }

  async writeTextFile(
    params: acp.WriteTextFileRequest,
  ): Promise<acp.WriteTextFileResponse> {
    await writeFile(params.path, params.content, 'utf-8');
    return {};
  }

  async createTerminal(
    params: acp.CreateTerminalRequest,
  ): Promise<acp.CreateTerminalResponse> {
    const terminalId = this.terminals.create(
      params.command,
      params.args ?? [],
      params.cwd ?? process.cwd(),
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
    this.terminals.release(params.terminalId);
    return {};
  }
}
