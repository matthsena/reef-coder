import { spawn } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import { zSessionNotification } from '@agentclientprotocol/sdk/dist/schema/zod.gen.js';
import { AgentClient } from './agent-client.ts';
import { TerminalManager } from './terminal-manager.ts';
import type { SessionStore } from './store.ts';

// Monkey-patch zSessionNotification to tolerate unknown session update shapes
// (e.g. tool_call_update content items that don't match the strict SDK schema).
// The SDK and this module share the same ESM singleton, so patching here
// makes ClientSideConnection fall back to raw data instead of throwing.
(zSessionNotification as any).parse = (data: unknown) => {
  const result = zSessionNotification.safeParse(data);
  if (result.success) return result.data;
  return data;
};

export interface AvailableModel {
  modelId: string;
}

export async function createConnection(
  executable: string,
  spawnArgs: string[],
  workdir: string,
  store: SessionStore,
  modelFlag?: { flag: string; value: string },
) {
  const allArgs = modelFlag
    ? [...spawnArgs, modelFlag.flag, modelFlag.value]
    : spawnArgs;
  store.emit('connection-status', `Spawning ${executable}...`);

  const agentProcess = spawn(executable, allArgs, {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const input = Writable.toWeb(agentProcess.stdin!);
  const output = Readable.toWeb(
    agentProcess.stdout!,
  ) as ReadableStream<Uint8Array>;

  const terminals = new TerminalManager();
  const client = new AgentClient(terminals, workdir, store);
  const stream = acp.ndJsonStream(input, output);
  const connection = new acp.ClientSideConnection((_agent) => client, stream);

  const initResult = await connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
    },
  });

  store.emit(
    'connection-status',
    `Connected (protocol v${initResult.protocolVersion})`,
  );

  const session = await connection.newSession({
    cwd: workdir,
    mcpServers: [],
  });

  store.emit('connection-status', `Session: ${session.sessionId}`);

  const availableModels: AvailableModel[] = session.models
    ? session.models.availableModels.map((m) => ({ modelId: m.modelId }))
    : [];
  const currentModelId = session.models?.currentModelId ?? null;

  if (currentModelId) {
    store.emit('connection-status', `Current model: ${currentModelId}`);
  }

  return {
    connection,
    sessionId: session.sessionId,
    availableModels,
    currentModelId,
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

export async function setSessionModel(
  connection: acp.ClientSideConnection,
  sessionId: string,
  modelId: string,
  store: SessionStore,
) {
  await connection.unstable_setSessionModel({ sessionId, modelId });
  store.emit('connection-status', `Model set to: ${modelId}`);
}
