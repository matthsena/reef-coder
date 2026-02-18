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
// Guarded to ensure the patch is only applied once.
let _patched = false;
function patchZodSchema() {
  if (_patched) return;
  _patched = true;
  (zSessionNotification as any).parse = (data: unknown) => {
    const result = zSessionNotification.safeParse(data);
    if (result.success) return result.data;
    return data;
  };
}

export interface AvailableModel {
  modelId: string;
}

export async function createConnection(
  executable: string,
  spawnArgs: string[],
  workdir: string,
  store: SessionStore,
) {
  patchZodSchema();

  store.emit('connection-status', `Spawning ${executable}...`);

  const agentProcess = spawn(executable, spawnArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  agentProcess.on('error', (err) => {
    store.emit('connection-status', `Spawn error: ${err.message}`);
  });

  if (!agentProcess.stdin || !agentProcess.stdout) {
    throw new Error(`Failed to open stdio pipes for ${executable}`);
  }

  // Forward stderr so agent errors are visible
  if (agentProcess.stderr) {
    let stderrBuf = '';
    agentProcess.stderr.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString();
      const lines = stderrBuf.split('\n');
      stderrBuf = lines.pop()!;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) store.emit('connection-status', `[stderr] ${trimmed}`);
      }
    });
  }

  const input = Writable.toWeb(agentProcess.stdin);
  const rawOutput = Readable.toWeb(
    agentProcess.stdout,
  ) as ReadableStream<Uint8Array>;

  // Filter non-JSON lines from agent stdout.  Some agents emit log messages
  // on stdout which break the ndjson parser and cause console.error output
  // that corrupts the Ink terminal display.
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();
  let stdoutBuf = '';
  const output = rawOutput.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        stdoutBuf += textDecoder.decode(chunk, { stream: true });
        const lines = stdoutBuf.split('\n');
        stdoutBuf = lines.pop() ?? '';
        const jsonLines: string[] = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('{')) {
            jsonLines.push(line);
          } else {
            store.emit('connection-status', `[agent stdout] ${trimmed}`);
          }
        }
        if (jsonLines.length > 0) {
          controller.enqueue(textEncoder.encode(jsonLines.join('\n') + '\n'));
        }
      },
      flush(controller) {
        const trimmed = stdoutBuf.trim();
        if (trimmed && trimmed.startsWith('{')) {
          controller.enqueue(textEncoder.encode(trimmed + '\n'));
        }
      },
    }),
  );

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
