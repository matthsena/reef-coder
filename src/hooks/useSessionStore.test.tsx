import { describe, expect, test, beforeEach } from 'bun:test';
import { useEffect } from 'react';
import { render } from 'ink-testing-library';
import { Text, Box } from 'ink';
import { SessionStore } from '../store.ts';
import { useSessionStore } from './useSessionStore.ts';

// Sleep long enough for React/ink render cycle even under --coverage
const RENDER_WAIT = 250;

// Wrapper component that exposes hook state as rendered text for assertions
function TestHarness({ store, onState }: {
  store: SessionStore;
  onState?: (state: ReturnType<typeof useSessionStore>) => void;
}) {
  const state = useSessionStore(store);

  useEffect(() => {
    onState?.(state);
  });

  return (
    <Box flexDirection="column">
      <Text>messages:{state.messages.length}</Text>
      <Text>streaming:{String(state.streaming)}</Text>
      <Text>current:{state.currentMessage ? 'yes' : 'no'}</Text>
      {state.currentMessage && (
        <Text>currentText:{state.currentMessage.text}</Text>
      )}
      {state.currentMessage && state.currentMessage.thoughts && (
        <Text>currentThoughts:{state.currentMessage.thoughts}</Text>
      )}
      {state.currentMessage &&
        state.currentMessage.toolCalls.map((tc) => (
          <Text key={tc.id}>
            tool:{tc.id}:{tc.status}
          </Text>
        ))}
      {state.currentMessage && state.currentMessage.plan.length > 0 && (
        <Text>plan:{state.currentMessage.plan.length}</Text>
      )}
      {state.messages.map((msg, i) => (
        <Text key={i}>
          msg{i}:{msg.role}:{msg.text.slice(0, 20)}
        </Text>
      ))}
    </Box>
  );
}

describe('useSessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  test('starts with empty messages and no streaming', () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    const frame = lastFrame()!;
    expect(frame).toContain('messages:0');
    expect(frame).toContain('streaming:false');
    expect(frame).toContain('current:no');
  });

  test('accumulates agent message chunks', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('agent-message-chunk', 'Hello');
    await Bun.sleep(RENDER_WAIT);

    let frame = lastFrame()!;
    expect(frame).toContain('current:yes');
    expect(frame).toContain('currentText:Hello');

    store.emit('agent-message-chunk', ' World');
    await Bun.sleep(RENDER_WAIT);

    frame = lastFrame()!;
    expect(frame).toContain('currentText:Hello World');
  });

  test('accumulates thought chunks', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('agent-thought-chunk', 'Thinking');
    await Bun.sleep(RENDER_WAIT);

    let frame = lastFrame()!;
    expect(frame).toContain('currentThoughts:Thinking');

    store.emit('agent-thought-chunk', ' more');
    await Bun.sleep(RENDER_WAIT);

    frame = lastFrame()!;
    expect(frame).toContain('currentThoughts:Thinking more');
  });

  test('tracks tool calls', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('tool-call', { id: 'tc-1', title: 'Read', status: 'started' });
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('tool:tc-1:started');
  });

  test('updates existing tool call status', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('tool-call', { id: 'tc-1', title: 'Read', status: 'started' });
    await Bun.sleep(RENDER_WAIT);

    // Verify started state first
    expect(lastFrame()!).toContain('tool:tc-1:started');

    store.emit('tool-call-update', 'tc-1', 'completed');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('tool:tc-1:completed');
  });

  test('updates tool call entry when same ID is emitted again', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('tool-call', { id: 'tc-1', title: 'Read', status: 'started' });
    await Bun.sleep(RENDER_WAIT);
    store.emit('tool-call', { id: 'tc-1', title: 'Read', status: 'completed' });
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    const matches = frame.match(/tool:tc-1/g);
    expect(matches).toHaveLength(1);
    expect(frame).toContain('tool:tc-1:completed');
  });

  test('tracks plan entries', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('plan', [
      { status: 'completed', content: 'Step 1' },
      { status: 'pending', content: 'Step 2' },
    ]);
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('plan:2');
  });

  test('turn-end finalizes current message into messages array', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('agent-message-chunk', 'Response text');
    await Bun.sleep(RENDER_WAIT);
    store.emit('turn-end', 'end_turn');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('messages:1');
    expect(frame).toContain('current:no');
    expect(frame).toContain('streaming:false');
    expect(frame).toContain('msg0:agent:Response text');
  });

  test('addUserMessage adds user message and starts streaming', async () => {
    let capturedState: ReturnType<typeof useSessionStore> | null = null;
    const { lastFrame } = render(
      <TestHarness
        store={store}
        onState={(s) => { capturedState = s; }}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    capturedState!.addUserMessage('Hello from user');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('messages:1');
    expect(frame).toContain('msg0:user:Hello from user');
    expect(frame).toContain('streaming:true');
    expect(frame).toContain('current:yes');
  });

  test('turn-end with no current message just sets streaming false', async () => {
    const { lastFrame } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    store.emit('turn-end', 'end_turn');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('messages:0');
    expect(frame).toContain('streaming:false');
  });

  test('cleanup removes listeners on unmount', async () => {
    const { unmount } = render(<TestHarness store={store} />);
    await Bun.sleep(RENDER_WAIT);

    unmount();
    await Bun.sleep(RENDER_WAIT);

    expect(store.listenerCount('agent-message-chunk')).toBe(0);
    expect(store.listenerCount('agent-thought-chunk')).toBe(0);
    expect(store.listenerCount('tool-call')).toBe(0);
    expect(store.listenerCount('tool-call-update')).toBe(0);
    expect(store.listenerCount('plan')).toBe(0);
    expect(store.listenerCount('turn-end')).toBe(0);
  });
});
