<p align="center">
  <img src="logo.png" alt="Reef Coder" width="200" />
</p>

<h1 align="center">Reef Coder</h1>

<p align="center">
  A unified terminal client for AI coding agents. Connect to Claude Code, GitHub Copilot, OpenCode, Qwen Code, and Codex through a single interface with persistent memory, cross-engine sessions, and voice input.
</p>

## Why Reef Coder?

Modern developers use multiple AI coding assistants. Each has strengths: Claude excels at reasoning, Copilot integrates with GitHub, Codex handles complex refactors. But switching between them means losing context, repeating yourself, and managing multiple terminal windows.

**Reef Coder solves this.** One interface, many agents, shared memory.

- **Unified Interface** — Same terminal UI for all supported agents
- **Persistent Sessions** — Your conversation history survives across restarts
- **Cross-Engine Memory** — Start a task with Claude, continue with Copilot, finish with Codex
- **Voice Input** — Code hands-free with speech-to-text transcription
- **Agent Client Protocol** — Built on ACP for standardized agent communication

## Supported Engines

| Engine | CLI Required | Description |
|--------|--------------|-------------|
| Claude Code | `claude` | Anthropic's coding assistant |
| GitHub Copilot | `gh copilot` | GitHub's AI pair programmer |
| OpenCode | `opencode` | Open-source coding agent |
| Qwen Code | `qwen` | Alibaba's coding model |
| Codex | `codex` | OpenAI's code generation model |

## Installation

**Prerequisites:**
- [Bun](https://bun.sh) runtime
- At least one supported engine CLI installed

```bash
# Clone the repository
git clone https://github.com/user/reef-coder.git
cd reef-coder

# Install dependencies
bun install

# Install globally
bun run build
```

After that, you can run `reef` from anywhere in your terminal.

### Configuration

Reef Coder loads environment variables from `~/.config/reef/.env`, so your API keys work from any directory without setting them globally.

```bash
# Create the config directory
mkdir -p ~/.config/reef

# Add your API keys
cp .env.sample ~/.config/reef/.env
# Edit ~/.config/reef/.env with your keys
```

## Usage

```bash
# Start Reef Coder
reef

# With custom working directory
reef --workdir /path/to/project
```

### Development

```bash
# Run locally without installing
bun run dev
```

### Interactive Flow

1. **Select Engine** — Choose which AI agent to connect to
2. **Select Model** — Pick the model variant (engine-specific defaults provided)
3. **Select Session** — Create new or continue existing session
4. **Chat** — Start coding with your AI assistant

### Voice Input

Press the voice input key to start recording. Speak your prompt naturally and Reef Coder will transcribe it and send to the agent. Perfect for:

- Describing complex requirements without typing
- Hands-free coding while reviewing documentation
- Accessibility for developers who prefer speech

### Session Management

Sessions are stored in `.reef/sessions/` within your working directory. Each session preserves:

- Full conversation history
- Message timestamps
- Engine used for each interaction

Resume any session with any engine — your context carries over.

## Commands

Inside a chat session:

- `exit` or `quit` — Close the session
- `/command` — Execute slash commands (engine-specific)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Reef Coder CLI                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Engine    │  │   Session   │  │   Terminal  │     │
│  │   Select    │  │   Select    │  │     Chat    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│              Voice Input + Session Store                │
│              (Speech-to-Text + React State)             │
├─────────────────────────────────────────────────────────┤
│                  Agent Client (ACP)                     │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│  Claude  │  Copilot │ OpenCode │   Qwen   │   Codex    │
└──────────┴──────────┴──────────┴──────────┴────────────┘
```

## Tech Stack

- **Runtime:** [Bun](https://bun.sh)
- **Language:** TypeScript (strict mode)
- **UI Framework:** [Ink](https://github.com/vadimdemedes/ink) (React for terminal)
- **Protocol:** [Agent Client Protocol](https://github.com/nichochar/agent-client-protocol)

## Development

```bash
# Run locally
bun run dev

# Type check
bunx tsc --noEmit
```

## License

MIT
