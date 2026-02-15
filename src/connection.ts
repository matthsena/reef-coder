import { spawn } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import { CopilotClient } from './copilot-client.ts';
import { TerminalManager } from './terminal-manager.ts';

export async function createConnection(executable: string, model: string) {
  const copilotProcess = spawn(executable, ['--acp', '--stdio', '--model', model], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const input = Writable.toWeb(copilotProcess.stdin!);
  const output = Readable.toWeb(
    copilotProcess.stdout!,
  ) as ReadableStream<Uint8Array>;

  const terminals = new TerminalManager();
  const client = new CopilotClient(terminals);
  const stream = acp.ndJsonStream(input, output);
  const connection = new acp.ClientSideConnection(
    (_agent) => client,
    stream,
  );

  const initResult = await connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {
      fs: { readTextFile: true, writeTextFile: true },
      terminal: true,
    },
  });

  console.log(
    `Connected to Copilot (protocol v${initResult.protocolVersion})`,
  );

  const session = await connection.newSession({
    cwd: process.cwd(),
    mcpServers: [],
  });

  console.log(`Session: ${session.sessionId}`);

  return {
    connection,
    sessionId: session.sessionId,
    shutdown: async () => {
      copilotProcess.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2000);
        copilotProcess.once('exit', () => { clearTimeout(timer); resolve(); });
      });
    },
  };
}
