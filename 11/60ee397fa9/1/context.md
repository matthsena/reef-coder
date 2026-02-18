# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Gemini CLI: Predefined Model Selection

## Context

When selecting Gemini CLI as the engine, users currently see a free-text "Enter model name:" prompt (`ModelInput` component) because Gemini CLI doesn't return `availableModels` via ACP — it only supports a `-m` CLI flag. The user wants to pick from predefined flash/pro options instead of typing a model name manually.

## Approach

Add a `predefinedModels` field to `EngineConfig` so engines that use `modelFlag`...

