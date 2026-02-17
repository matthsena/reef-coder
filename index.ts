import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { render } from 'ink';
import React from 'react';
import { App } from './src/components/App.tsx';

async function main() {
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

  render(React.createElement(App, { workdir }));
}

main().catch(console.error);
