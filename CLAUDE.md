# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies:** `bun install`
- **Run:** `bun run index.ts`
- **Type check:** `bunx tsc --noEmit`

## Overview

CLI client for GitHub Copilot, Claude Code, OpenCode, Qwen Code, and Codex using the Agent Client Protocol (ACP). Features an interactive terminal UI built with Ink (React for the terminal). On launch, presents an engine selection screen, then model selection, then connects and enters a chat REPL with streamed responses.

## Architecture

- `index.ts` — Entry point. Parses `--workdir`, renders the Ink `<App>` component.
- `src/types.ts` — Shared types (`Screen`, `ChatMessage`, `ToolCallEntry`, `PlanEntry`) and `ENGINES` config dict.
- `src/store.ts` — `SessionStore` typed EventEmitter bridging ACP streaming callbacks to React state.
- `src/connection.ts` — Spawns the agent process, wires up ACP streams, initializes session. Emits status via `SessionStore`.
- `src/agent-client.ts` — `AgentClient` implements `acp.Client`: emits session updates to `SessionStore`, auto-accepts permissions, delegates filesystem and terminal operations.
- `src/terminal-manager.ts` — `TerminalManager` class encapsulating child process lifecycle (create, output, wait, kill, release) with a `Map`-based registry.
- `src/hooks/useSessionStore.ts` — React hook subscribing to `SessionStore` events, manages `messages[]` + `currentMessage` state.
- `src/components/` — Ink UI components: `App`, `Header`, `EngineSelect`, `Connecting`, `Chat`, `MessageBubble`, `ToolCallCard`, `ThoughtBlock`, `PlanView`, `StatusBar`, `PromptInput`.

## Key Details

- Runtime is **Bun** (not Node.js)
- TypeScript with strict mode, `noEmit`, JSX (`react-jsx`), and bundler module resolution (`allowImportingTsExtensions` — use `.ts`/`.tsx` extensions in imports)
- UI built with **Ink** (React for the terminal) — no default engine; interactive selection on startup
