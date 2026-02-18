# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Plano: Voice Input via Tab no PromptInput

## Contexto

O usuário quer adicionar input de voz ao chat: ao pressionar Tab durante a digitação do prompt, inicia gravação contínua com `arecord`; ao pressionar Tab novamente, para a gravação, transcreve com Whisper da OpenAI, e insere o texto transcrito no prompt. A feature precisa ter indicador visual explícito do estado de gravação.

## Arquitetura

Dois arquivos novos + modificação do PromptInput:

```...

