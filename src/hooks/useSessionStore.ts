import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionStore } from '../store.ts';
import type { ChatMessage, ToolCallEntry, PlanEntry } from '../types.ts';

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function emptyMessage(role: 'user' | 'agent'): ChatMessage {
  return {
    role,
    text: '',
    thoughts: '',
    toolCalls: [],
    plan: [],
    timestamp: timestamp(),
  };
}

interface UseSessionStoreOptions {
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
}

export function useSessionStore(
  store: SessionStore,
  options: UseSessionStoreOptions = {},
) {
  const { initialMessages = [], onMessagesChange } = options;
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(
    null,
  );
  const [streaming, setStreaming] = useState(false);
  const currentRef = useRef<ChatMessage | null>(null);
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;

  // Track if this is the initial render to avoid calling onMessagesChange
  const isInitialRender = useRef(true);
  const prevMessagesLengthRef = useRef(initialMessages.length);

  // Notify parent of message changes via effect (not during render)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    // Only notify if messages actually changed (new message added)
    if (messages.length !== prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = messages.length;
      if (onMessagesChangeRef.current) {
        onMessagesChangeRef.current(messages);
      }
    }
  }, [messages]);

  useEffect(() => {
    const onChunk = (text: string) => {
      const msg = currentRef.current ?? emptyMessage('agent');
      const updated = { ...msg, text: msg.text + text };
      currentRef.current = updated;
      setCurrentMessage(updated);
    };

    const onThought = (text: string) => {
      const msg = currentRef.current ?? emptyMessage('agent');
      const updated = { ...msg, thoughts: msg.thoughts + text };
      currentRef.current = updated;
      setCurrentMessage(updated);
    };

    const onToolCall = (entry: ToolCallEntry) => {
      const msg = currentRef.current ?? emptyMessage('agent');
      const existing = msg.toolCalls.findIndex((t) => t.id === entry.id);
      const toolCalls =
        existing >= 0
          ? msg.toolCalls.map((t, i) => (i === existing ? entry : t))
          : [...msg.toolCalls, entry];
      const updated = { ...msg, toolCalls };
      currentRef.current = updated;
      setCurrentMessage(updated);
    };

    const onToolCallUpdate = (id: string, status: string) => {
      const msg = currentRef.current ?? emptyMessage('agent');
      const toolCalls = msg.toolCalls.map((t) =>
        t.id === id ? { ...t, status } : t,
      );
      const updated = { ...msg, toolCalls };
      currentRef.current = updated;
      setCurrentMessage(updated);
    };

    const onPlan = (entries: PlanEntry[]) => {
      const msg = currentRef.current ?? emptyMessage('agent');
      const updated = { ...msg, plan: entries };
      currentRef.current = updated;
      setCurrentMessage(updated);
    };

    const onTurnEnd = (_stopReason: string) => {
      const msg = currentRef.current;
      if (msg) {
        const hasContent =
          msg.text || msg.thoughts || msg.toolCalls.length > 0 || msg.plan.length > 0;
        if (hasContent) {
          setMessages((prev) => [...prev, msg]);
        }
        currentRef.current = null;
        setCurrentMessage(null);
      }
      setStreaming(false);
    };

    store.on('agent-message-chunk', onChunk);
    store.on('agent-thought-chunk', onThought);
    store.on('tool-call', onToolCall);
    store.on('tool-call-update', onToolCallUpdate);
    store.on('plan', onPlan);
    store.on('turn-end', onTurnEnd);

    return () => {
      store.off('agent-message-chunk', onChunk);
      store.off('agent-thought-chunk', onThought);
      store.off('tool-call', onToolCall);
      store.off('tool-call-update', onToolCallUpdate);
      store.off('plan', onPlan);
      store.off('turn-end', onTurnEnd);
    };
  }, [store]);

  const addUserMessage = useCallback((text: string) => {
    const msg: ChatMessage = { ...emptyMessage('user'), text };
    setMessages((prev) => [...prev, msg]);
    currentRef.current = emptyMessage('agent');
    setCurrentMessage(currentRef.current);
    setStreaming(true);
  }, []);

  return { messages, currentMessage, streaming, addUserMessage };
}
