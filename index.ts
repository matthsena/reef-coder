#!/usr/bin/env bun
import { resolve, join } from 'node:path';
import { stat, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { render } from 'ink';
import React from 'react';
import { App } from './src/components/App.tsx';

// Load ~/.config/reef/.env so API keys work from any directory
const globalEnvPath = join(homedir(), '.config', 'reef', '.env');
const globalEnvFile = Bun.file(globalEnvPath);
if (await globalEnvFile.exists()) {
  const content = await globalEnvFile.text();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    // Don't override variables already set in the environment
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

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
