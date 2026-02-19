# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Install dependencies:** `bun install`
- **Run:** `bun run index.ts`
- **Type check:** `bunx tsc --noEmit`

## Overview

**Reef Coder** is a unified terminal client that connects to multiple AI coding agents (Claude Code, GitHub Copilot, OpenCode, Qwen Code, Codex) through the Agent Client Protocol (ACP). It features persistent sessions with shared memory across different engines, voice input for hands-free coding, and allows you to switch between agents while maintaining conversation context.

## Architecture

- `index.ts` — Entry point. Parses `--workdir`, renders the Ink `<App>` component.
- `src/types.ts` — Shared types (`Screen`, `ChatMessage`, `ToolCallEntry`, `PlanEntry`) and `ENGINES` config dict.
- `src/store.ts` — `SessionStore` typed EventEmitter bridging ACP streaming callbacks to React state.
- `src/connection.ts` — Spawns the agent process, wires up ACP streams, initializes session. Emits status via `SessionStore`.
- `src/agent-client.ts` — `AgentClient` implements `acp.Client`: emits session updates to `SessionStore`, auto-accepts permissions, delegates filesystem and terminal operations.
- `src/terminal-manager.ts` — `TerminalManager` class encapsulating child process lifecycle (create, output, wait, kill, release) with a `Map`-based registry.
- `src/session-manager.ts` — Handles persistent session storage, loading, and saving with cross-engine memory.
- `src/hooks/useSessionStore.ts` — React hook subscribing to `SessionStore` events, manages `messages[]` + `currentMessage` state.
- `src/components/` — Ink UI components: `App`, `Header`, `EngineSelect`, `SessionSelect`, `Connecting`, `Chat`, `MessageBubble`, `ToolCallCard`, `ThoughtBlock`, `PlanView`, `StatusBar`, `PromptInput`.

## Key Details

- Runtime is **Bun** (not Node.js)
- TypeScript with strict mode, `noEmit`, JSX (`react-jsx`), and bundler module resolution (`allowImportingTsExtensions` — use `.ts`/`.tsx` extensions in imports)
- UI built with **Ink** (React for the terminal) — no default engine; interactive selection on startup
- Sessions are persisted in `.reef/sessions/` within the working directory
