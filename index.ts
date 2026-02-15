import readline from 'node:readline/promises';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { createConnection } from './src/connection.ts';

const EXIT_COMMANDS = new Set(['exit', 'quit']);

async function main() {
  const engines: Record<string, { executable: string; args: string[]; model: string }> = {
    'copilot': { executable: 'copilot', args: ['--acp', '--stdio'], model: 'gpt-5-mini' },
    'claude-code': { executable: 'claude-code-acp', args: [], model: 'sonnet' },
  };

  const engineIndex = process.argv.indexOf('--engine');
  const engineName = engineIndex !== -1 ? process.argv[engineIndex + 1]! : 'copilot';
  const engine = engines[engineName];
  if (!engine) {
    console.error(`Error: unknown engine "${engineName}". Available: ${Object.keys(engines).join(', ')}`);
    process.exit(1);
  }

  const workdirIndex = process.argv.indexOf('--workdir');
  const workdir =
    workdirIndex !== -1
      ? resolve(process.argv[workdirIndex + 1]!)
      : process.cwd();

  const workdirStat = await stat(workdir).catch(() => null);
  if (!workdirStat || !workdirStat.isDirectory()) {
    console.error(
      `Error: --workdir path does not exist or is not a directory: ${workdir}`,
    );
    process.exit(1);
  }

  const { connection, sessionId, shutdown } = await createConnection(
    engine.executable,
    engine.args,
    engine.model,
    workdir,
  );

  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    while (true) {
      const input = (await rl.question('You> ')).trim();

      if (EXIT_COMMANDS.has(input)) {
        console.log('Goodbye.');
        rl.close();
        break;
      }

      if (!input) continue;

      const result = await connection.prompt({
        sessionId,
        prompt: [{ type: 'text', text: input }],
      });

      console.log(`\n[stop: ${result.stopReason}]\n`);
    }
  } catch (error) {
    console.error('Error:', error);
    await shutdown();
    process.exit(1);
  }
  await shutdown();
}

main().catch(console.error);
