import { useCallback, useMemo } from 'react';
import { Box, Static, useApp } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import type { SessionStore } from '../store.ts';
import type { ChatMessage } from '../types.ts';
import { useSessionStore } from '../hooks/useSessionStore.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { StatusBar } from './StatusBar.tsx';
import { PromptInput } from './PromptInput.tsx';

type StaticItem =
  | { type: 'header'; engine: string; model: string; sessionId: string }
  | { type: 'message'; msg: ChatMessage; index: number };

interface ChatProps {
  engine: string;
  model: string;
  sessionId: string;
  connection: acp.ClientSideConnection;
  store: SessionStore;
  onExit: () => void | Promise<void>;
}

export function Chat({
  engine,
  model,
  sessionId,
  connection,
  store,
  onExit,
}: ChatProps) {
  const { messages, currentMessage, streaming, addUserMessage } =
    useSessionStore(store);
  const { exit } = useApp();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (text === 'exit' || text === 'quit') {
        await onExit();
        exit();
        return;
      }

      addUserMessage(text);

      try {
        const result = await connection.prompt({
          sessionId,
          prompt: [{ type: 'text', text }],
        });
        store.emit('turn-end', result.stopReason);
      } catch {
        store.emit('turn-end', 'error');
      }
    },
    [connection, sessionId, store, addUserMessage, onExit, exit],
  );

  const staticItems: StaticItem[] = useMemo(
    () => [
      { type: 'header' as const, engine, model, sessionId },
      ...messages.map((msg, index) => ({ type: 'message' as const, msg, index })),
    ],
    [engine, model, sessionId, messages],
  );

  return (
    <Box flexDirection="column">
      <Static items={staticItems}>
        {(item) => {
          if (item.type === 'header') {
            return (
              <Box key="header">
                <StatusBar engine={item.engine} model={item.model} sessionId={item.sessionId} />
              </Box>
            );
          }
          return (
            <Box key={`${item.msg.timestamp}-${item.msg.role}-${item.index}`} flexDirection="column">
              <MessageBubble message={item.msg} />
            </Box>
          );
        }}
      </Static>

      {currentMessage ? <MessageBubble message={currentMessage} /> : null}

      <PromptInput disabled={streaming} onSubmit={handleSubmit} />
    </Box>
  );
}
