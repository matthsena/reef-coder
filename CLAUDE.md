# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies:** `bun install`
- **Run:** `bun run index.ts`
- **Type check:** `bunx tsc --noEmit`

## Overview

CLI client for GitHub Copilot, Claude Code, Gemini CLI, OpenCode, Qwen Code, and Codex using the Agent Client Protocol (ACP). Spawns an agent subprocess, communicates over newline-delimited JSON streams, and provides an interactive REPL for prompts and streamed responses. The engine is selected via the `--engine` flag (`copilot`, `claude-code`, `gemini`, `opencode`, `qwen-code`, or `codex`).

## Architecture

- `index.ts` — Entry point. Parses CLI args (`--engine`, `--workdir`), creates the ACP connection, runs the readline REPL loop.
- `src/connection.ts` — Spawns the agent process, wires up ACP streams, initializes session. Returns `{ connection, sessionId, shutdown }`.
- `src/agent-client.ts` — `AgentClient` implements `acp.Client`: handles session updates (streamed text/thoughts/tool calls/plans), auto-accepts permissions, delegates filesystem and terminal operations. ANSI color helpers are inlined here.
- `src/terminal-manager.ts` — `TerminalManager` class encapsulating child process lifecycle (create, output, wait, kill, release) with a `Map`-based registry.

## Key Details

- Runtime is **Bun** (not Node.js)
- TypeScript with strict mode, `noEmit`, and bundler module resolution (`allowImportingTsExtensions` — use `.ts` extensions in imports)
- Engine and model are selected via `--engine` flag; defaults to `copilot` with `gpt-5-mini`
