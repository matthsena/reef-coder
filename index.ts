import { resolve } from 'node:path';
import { stat, realpath } from 'node:fs/promises';
import { render } from 'ink';
import React from 'react';
import { App } from './src/components/App.tsx';

async function main() {
  const workdirIndex = process.argv.indexOf('--workdir');
  let workdir: string;
  if (workdirIndex !== -1) {
    const workdirArg = process.argv[workdirIndex + 1];
    if (!workdirArg) {
      console.error('Error: --workdir requires a path argument');
      process.exit(1);
    }
    workdir = resolve(workdirArg);
  } else {
    workdir = process.cwd();
  }

  const workdirStat = await stat(workdir).catch(() => null);
  if (!workdirStat || !workdirStat.isDirectory()) {
    console.error(
      `Error: --workdir path does not exist or is not a directory: ${workdir}`,
    );
    process.exit(1);
  }

  const realWorkdir = await realpath(workdir);
  render(React.createElement(App, { workdir: realWorkdir }));
}

main().catch(console.error);
