# Session Context

## User Prompts

### Prompt 1

Implement the following plan:

# Image Support via `@image:` File Path References

## Context

The codex-acp and claude-agent-acp agents declare `promptCapabilities.image: true` in their ACP handshake, meaning they accept image content blocks. However, the agent-swarm client currently only sends text, renders received images as `[image]`, and has no mechanism for users to attach images. The user wants to reference images by file path (similar to Claude Code) and have them sent as base64-encoded ...

### Prompt 2

olha funcionou!!! porem quando o nome esta assim: @image:/home/matheus/Pictures/Screenshot from
  2026-01-23 17-36-19.png
ele nao encontra... vc pode fazer uma forma de corrigir isso? talvez passando o caminho entre aspas simples

### Prompt 3

olha... pode comittar tudo em grupos semanticos, sem voce como coauthor

