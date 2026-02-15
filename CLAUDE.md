# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies:** `bun install`
- **Run:** `bun run index.ts`
- **Type check:** `bunx tsc --noEmit`

## Overview

CLI client for GitHub Copilot using the Agent Client Protocol (ACP). Spawns a Copilot subprocess (`copilot --acp --stdio`), communicates over newline-delimited JSON streams, and provides an interactive REPL for prompts and streamed responses.

## Architecture

- `index.ts` — Entry point. Parses `COPILOT_CLI_PATH` env, creates the ACP connection, runs the readline REPL loop.
- `src/connection.ts` — Spawns the Copilot process, wires up ACP streams, initializes session. Returns `{ connection, sessionId, shutdown }`.
- `src/copilot-client.ts` — `CopilotClient` implements `acp.Client`: handles session updates (streamed text/thoughts/tool calls/plans), auto-accepts permissions, delegates filesystem and terminal operations. ANSI color helpers are inlined here.
- `src/terminal-manager.ts` — `TerminalManager` class encapsulating child process lifecycle (create, output, wait, kill, release) with a `Map`-based registry.

## Key Details

- Runtime is **Bun** (not Node.js)
- TypeScript with strict mode, `noEmit`, and bundler module resolution (`allowImportingTsExtensions` — use `.ts` extensions in imports)
- Default model is `gpt-5-mini`, overridable via `COPILOT_MODEL` env var
- The Copilot executable path can be overridden via `COPILOT_CLI_PATH` env var
