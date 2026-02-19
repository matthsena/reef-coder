# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Gemini CLI: Predefined Model Selection

## Context

When selecting Gemini CLI as the engine, users currently see a free-text "Enter model name:" prompt (`ModelInput` component) because Gemini CLI doesn't return `availableModels` via ACP — it only supports a `-m` CLI flag. The user wants to pick from predefined flash/pro options instead of typing a model name manually.

## Approach

Add a `predefinedModels` field to `EngineConfig` so engines that use `modelFlag`...

### Prompt 2

olhe esses dois links https://github.com/zed-industries/codex-acp https://github.com/zed-industries/claude-agent-acp do codex e do claude code... que usam uma conexao personalizada! eles dizem no acp que o meu agente tem capacidades de visualizar imagens! queria saber se é isso mesmo e se isso esta funcionando atualmente (para todas as engines)

### Prompt 3

entendi! vc consegue colocar essa capacidade? no claude code hoje referenciamos passando o diretorio da imagem... e ele consegue ler!

### Prompt 4

[Request interrupted by user for tool use]

