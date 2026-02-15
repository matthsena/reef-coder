import readline from 'node:readline/promises';
import { createConnection } from './src/connection.ts';

const EXIT_COMMANDS = new Set(['exit', 'quit']);

async function main() {
  const executable = process.env.COPILOT_CLI_PATH ?? 'copilot';
  const model = process.env.COPILOT_MODEL ?? 'gpt-5-mini';
  const { connection, sessionId, shutdown } = await createConnection(executable, model);

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
