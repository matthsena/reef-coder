import { useCallback } from 'react';
import { Box, Static, useApp } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import type { SessionStore } from '../store.ts';
import { useSessionStore } from '../hooks/useSessionStore.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { StatusBar } from './StatusBar.tsx';
import { PromptInput } from './PromptInput.tsx';

interface ChatProps {
  engine: string;
  model: string;
  sessionId: string;
  connection: acp.ClientSideConnection;
  store: SessionStore;
  onExit: () => void;
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
        onExit();
        exit();
        return;
      }

      addUserMessage(text);

      const result = await connection.prompt({
        sessionId,
        prompt: [{ type: 'text', text }],
      });

      store.emit('turn-end', result.stopReason);
    },
    [connection, sessionId, store, addUserMessage, onExit, exit],
  );

  return (
    <Box flexDirection="column">
      <Static items={messages}>
        {(msg, i) => (
          <Box key={i} flexDirection="column">
            <MessageBubble message={msg} />
          </Box>
        )}
      </Static>

      {currentMessage ? <MessageBubble message={currentMessage} /> : null}

      <StatusBar engine={engine} model={model} sessionId={sessionId} />
      <PromptInput disabled={streaming} onSubmit={handleSubmit} />
    </Box>
  );
}
