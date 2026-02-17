# agent-swarm

Interactive terminal UI for GitHub Copilot, Claude Code, Gemini CLI, OpenCode, Qwen Code, and Codex using the [Agent Client Protocol (ACP)](https://github.com/nichochar/agent-client-protocol). Built with [Ink](https://github.com/vadimdemedes/ink) (React for the terminal).

Each engine's CLI must be installed separately before use.

## Setup

```bash
bun install
```

## Usage

```bash
bun run index.ts
```

On launch, the app presents an interactive engine selection screen, then asks for the model (pre-filled with the engine default), then connects and enters a chat REPL.

### Options

- `--workdir <path>` — Set the working directory for the agent (defaults to current directory)

### Examples

```bash
# Launch with interactive engine selection
bun run index.ts

# Set a custom working directory
bun run index.ts --workdir /path/to/project
```

Inside the chat, type your prompt and press Enter. Type `exit` or `quit` to close.

## Architecture

| File | Description |
|------|-------------|
| `index.ts` | Entry point. Parses `--workdir`, renders the Ink `<App>` component. |
| `src/types.ts` | Shared types and `ENGINES` config dict. |
| `src/store.ts` | `SessionStore` — typed EventEmitter bridging ACP callbacks to React state. |
| `src/connection.ts` | Spawns the agent process, wires up ACP streams, initializes session. |
| `src/agent-client.ts` | `AgentClient` — emits session updates to `SessionStore`, auto-accepts permissions, delegates FS/terminal ops. |
| `src/terminal-manager.ts` | `TerminalManager` — child process lifecycle management. |
| `src/hooks/useSessionStore.ts` | React hook subscribing to `SessionStore` events. |
| `src/components/` | Ink UI components: `App`, `Header`, `EngineSelect`, `ModelInput`, `Connecting`, `Chat`, `MessageBubble`, `ToolCallCard`, `ThoughtBlock`, `PlanView`, `StatusBar`, `PromptInput`. |

## Tech stack

- **Runtime:** [Bun](https://bun.com)
- **Language:** TypeScript (strict mode)
- **UI:** [Ink](https://github.com/vadimdemedes/ink) (React for the terminal)
- **Protocol:** [Agent Client Protocol SDK](https://www.npmjs.com/package/@agentclientprotocol/sdk)
