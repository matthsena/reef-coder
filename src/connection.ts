import { spawn } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import { zSessionNotification } from '@agentclientprotocol/sdk/dist/schema/zod.gen.js';
import { AgentClient } from './agent-client.ts';
import { TerminalManager } from './terminal-manager.ts';

// Monkey-patch zSessionNotification to tolerate unknown session update shapes
// (e.g. tool_call_update content items that don't match the strict SDK schema).
// The SDK and this module share the same ESM singleton, so patching here
// makes ClientSideConnection fall back to raw data instead of throwing.
(zSessionNotification as any).parse = (data: unknown) => {
  const result = zSessionNotification.safeParse(data);
  if (result.success) return result.data;
  return data;
};

export async function createConnection(
  executable: string,
  spawnArgs: string[],
  model: string,
  workdir: string,
) {
  const agentProcess = spawn(executable, spawnArgs, {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const input = Writable.toWeb(agentProcess.stdin!);
  const output = Readable.toWeb(
    agentProcess.stdout!,
  ) as ReadableStream<Uint8Array>;

  const terminals = new TerminalManager();
  const client = new AgentClient(terminals, workdir);
  const stream = acp.ndJsonStream(input, output);
  const connection = new acp.ClientSideConnection((_agent) => client, stream);

  const initResult = await connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
    },
  });

  console.log(`Connected to agent (protocol v${initResult.protocolVersion})`);

  const session = await connection.newSession({
    cwd: workdir,
    mcpServers: [],
  });

  console.log(`Session: ${session.sessionId}`);

  if (session.models) {
    console.log(`Model: ${session.models.currentModelId}`);
    console.log(
      `Available: ${session.models.availableModels.map((m) => m.modelId).join(', ')}`,
    );
  }

  await connection.unstable_setSessionModel({
    sessionId: session.sessionId,
    modelId: model,
  });
  console.log(`Model set to: ${model}\n`);

  return {
    connection,
    sessionId: session.sessionId,
    shutdown: async () => {
      agentProcess.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        agentProcess.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    },
  };
}
