import { useCallback, useMemo, useRef } from 'react';
import { Box, Static, useApp } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import type { SessionStore } from '../store.ts';
import type { ChatMessage, Session } from '../types.ts';
import { useSessionStore } from '../hooks/useSessionStore.ts';
import { buildPromptBlocks } from '../image-utils.ts';
import {
  formatSessionContext,
  updateSessionMessages,
} from '../session-manager.ts';
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
  workdir: string;
  session: Session;
  onExit: () => void | Promise<void>;
  onSwitchEngine: () => void | Promise<void>;
  onSessionUpdate: (session: Session) => void;
}

export function Chat({
  engine,
  model,
  sessionId,
  connection,
  store,
  workdir,
  session,
  onExit,
  onSwitchEngine,
  onSessionUpdate,
}: ChatProps) {
  const contextInjectedRef = useRef(false);

  const handleMessagesChange = useCallback(
    (newMessages: ChatMessage[]) => {
      const updated = updateSessionMessages(session, newMessages, engine, model);
      onSessionUpdate(updated);
    },
    [session, engine, model, onSessionUpdate],
  );

  const { messages, currentMessage, streaming, addUserMessage } =
    useSessionStore(store, {
      initialMessages: session.messages,
      onMessagesChange: handleMessagesChange,
    });
  const { exit } = useApp();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (text === 'exit' || text === 'quit') {
        await onExit();
        exit();
        return;
      }

      if (text === '/switch' || text === '/engine') {
        await onSwitchEngine();
        return;
      }

      addUserMessage(text);

      try {
        // Inject context from previous engine on first prompt if session has history
        let promptText = text;
        if (
          !contextInjectedRef.current &&
          session.messages.length > 0 &&
          session.lastEngine !== engine
        ) {
          const context = formatSessionContext(session);
          promptText = context + text;
          contextInjectedRef.current = true;
        }

        const result = await connection.prompt({
          sessionId,
          prompt: await buildPromptBlocks(promptText, workdir),
        });
        store.emit('turn-end', result.stopReason);
      } catch (err) {
        let msg: string;
        if (err instanceof Error) {
          msg = err.message;
        } else if (typeof err === 'object' && err !== null) {
          msg = JSON.stringify(err);
        } else {
          msg = String(err);
        }
        store.emit('agent-message-chunk', `\n[error: ${msg}]\n`);
        store.emit('turn-end', 'error');
      }
    },
    [
      connection,
      sessionId,
      store,
      workdir,
      session,
      engine,
      addUserMessage,
      onExit,
      onSwitchEngine,
      exit,
    ],
  );

  const staticItems: StaticItem[] = useMemo(
    () => [
      { type: 'header' as const, engine, model, sessionId: session.id },
      ...messages.map((msg, index) => ({ type: 'message' as const, msg, index })),
    ],
    [engine, model, session.id, messages],
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
