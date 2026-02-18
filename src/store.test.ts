import { describe, expect, test, mock } from 'bun:test';
import { SessionStore } from './store.ts';
import type { ToolCallEntry, PlanEntry } from './types.ts';

describe('SessionStore', () => {
  test('is an EventEmitter', () => {
    const store = new SessionStore();
    expect(store.on).toBeFunction();
    expect(store.emit).toBeFunction();
    expect(store.off).toBeFunction();
  });

  test('emits and receives agent-message-chunk', () => {
    const store = new SessionStore();
    const handler = mock<(text: string) => void>();
    store.on('agent-message-chunk', handler);
    store.emit('agent-message-chunk', 'Hello');
    expect(handler).toHaveBeenCalledWith('Hello');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('emits and receives agent-thought-chunk', () => {
    const store = new SessionStore();
    const handler = mock<(text: string) => void>();
    store.on('agent-thought-chunk', handler);
    store.emit('agent-thought-chunk', 'Thinking...');
    expect(handler).toHaveBeenCalledWith('Thinking...');
  });

  test('emits and receives tool-call', () => {
    const store = new SessionStore();
    const handler = mock<(entry: ToolCallEntry) => void>();
    store.on('tool-call', handler);
    const entry: ToolCallEntry = { id: 'tc-1', title: 'Read', status: 'started' };
    store.emit('tool-call', entry);
    expect(handler).toHaveBeenCalledWith(entry);
  });

  test('emits and receives tool-call-update', () => {
    const store = new SessionStore();
    const handler = mock<(id: string, status: string) => void>();
    store.on('tool-call-update', handler);
    store.emit('tool-call-update', 'tc-1', 'completed');
    expect(handler).toHaveBeenCalledWith('tc-1', 'completed');
  });

  test('emits and receives plan', () => {
    const store = new SessionStore();
    const handler = mock<(entries: PlanEntry[]) => void>();
    store.on('plan', handler);
    const entries: PlanEntry[] = [{ status: 'pending', content: 'Step 1' }];
    store.emit('plan', entries);
    expect(handler).toHaveBeenCalledWith(entries);
  });

  test('emits and receives permission', () => {
    const store = new SessionStore();
    const handler = mock<(message: string) => void>();
    store.on('permission', handler);
    store.emit('permission', 'Auto-accepting: "allow" (kind)');
    expect(handler).toHaveBeenCalledWith('Auto-accepting: "allow" (kind)');
  });

  test('emits and receives connection-status', () => {
    const store = new SessionStore();
    const handler = mock<(message: string) => void>();
    store.on('connection-status', handler);
    store.emit('connection-status', 'Connected');
    expect(handler).toHaveBeenCalledWith('Connected');
  });

  test('emits and receives turn-end', () => {
    const store = new SessionStore();
    const handler = mock<(stopReason: string) => void>();
    store.on('turn-end', handler);
    store.emit('turn-end', 'end_turn');
    expect(handler).toHaveBeenCalledWith('end_turn');
  });

  test('unsubscribe with off() stops delivery', () => {
    const store = new SessionStore();
    const handler = mock<(text: string) => void>();
    store.on('agent-message-chunk', handler);
    store.emit('agent-message-chunk', 'first');
    expect(handler).toHaveBeenCalledTimes(1);

    store.off('agent-message-chunk', handler);
    store.emit('agent-message-chunk', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('multiple listeners on same event', () => {
    const store = new SessionStore();
    const h1 = mock<(text: string) => void>();
    const h2 = mock<(text: string) => void>();
    store.on('agent-message-chunk', h1);
    store.on('agent-message-chunk', h2);
    store.emit('agent-message-chunk', 'both');
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  test('events do not cross-contaminate', () => {
    const store = new SessionStore();
    const chunkHandler = mock<(text: string) => void>();
    const thoughtHandler = mock<(text: string) => void>();
    store.on('agent-message-chunk', chunkHandler);
    store.on('agent-thought-chunk', thoughtHandler);

    store.emit('agent-message-chunk', 'chunk');
    expect(chunkHandler).toHaveBeenCalledTimes(1);
    expect(thoughtHandler).toHaveBeenCalledTimes(0);
  });
});
