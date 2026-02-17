# agent-swarm

CLI client for GitHub Copilot and Claude Code using the [Agent Client Protocol (ACP)](https://github.com/nichochar/agent-client-protocol). Spawns an agent subprocess, communicates over newline-delimited JSON streams, and provides an interactive REPL for prompts and streamed responses.

## Setup

```bash
bun install
```

## Usage

```bash
bun run index.ts
```

### Options

- `--engine <name>` — Select the agent engine. Available: `copilot` (default), `claude-code`
- `--workdir <path>` — Set the working directory for the agent (defaults to current directory)

### Examples

```bash
# Use Copilot (default)
bun run index.ts

# Use Claude Code as engine
bun run index.ts --engine claude-code

# Set a custom working directory
bun run index.ts --workdir /path/to/project
```

Inside the REPL, type your prompt and press Enter. Type `exit` or `quit` to close.

## Architecture

| File | Description |
|------|-------------|
| `index.ts` | Entry point. Parses CLI args, creates the ACP connection, runs the readline REPL loop. |
| `src/connection.ts` | Spawns the agent process, wires up ACP streams, initializes session. |
| `src/agent-client.ts` | `AgentClient` — handles session updates (streamed text/thoughts/tool calls/plans), auto-accepts permissions, delegates filesystem and terminal operations. |
| `src/terminal-manager.ts` | `TerminalManager` — encapsulates child process lifecycle (create, output, wait, kill, release). |

## Tech stack

- **Runtime:** [Bun](https://bun.com)
- **Language:** TypeScript (strict mode)
- **Protocol:** [Agent Client Protocol SDK](https://www.npmjs.com/package/@agentclientprotocol/sdk)
