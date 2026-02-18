import { describe, expect, test, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { Chat } from './Chat.tsx';
import { SessionStore } from '../store.ts';

const RENDER_WAIT = 250;

function makeMockConnection() {
  return {
    prompt: mock(() => Promise.resolve({ stopReason: 'end_turn' })),
  };
}

describe('Chat', () => {
  test('renders StatusBar with engine, model, and session', () => {
    const store = new SessionStore();
    const conn = makeMockConnection();

    const { lastFrame } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="abcdef1234567890"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );

    const frame = lastFrame()!;
    expect(frame).toContain('Claude Code');
    expect(frame).toContain('opus');
    expect(frame).toContain('abcdef12');
  });

  test('renders PromptInput', () => {
    const store = new SessionStore();
    const conn = makeMockConnection();

    const { lastFrame } = render(
      <Chat
        engine="gemini"
        model="gemini-2.5-flash"
        sessionId="session123"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );

    const frame = lastFrame()!;
    expect(frame).toContain('You');
    expect(frame).toContain('>');
  });

  test('displays agent messages from store events', async () => {
    const store = new SessionStore();
    const conn = makeMockConnection();

    const { lastFrame } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );

    // Wait for initial render to settle
    await Bun.sleep(RENDER_WAIT);

    // Simulate an agent response
    store.emit('agent-message-chunk', 'Hello from agent');
    await Bun.sleep(RENDER_WAIT);

    expect(lastFrame()!).toContain('Hello from agent');
  });

  test('shows agent message bubble after turn ends', async () => {
    const store = new SessionStore();
    const conn = makeMockConnection();

    const { lastFrame } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    store.emit('agent-message-chunk', 'Completed response');
    await Bun.sleep(RENDER_WAIT);
    store.emit('turn-end', 'end_turn');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('Agent');
    expect(frame).toContain('Completed response');
  });

  test('shows waiting message while streaming', async () => {
    const store = new SessionStore();
    // Make prompt hang forever
    const conn = {
      prompt: mock(() => new Promise(() => {})),
    };

    const { stdin, lastFrame } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );

    await Bun.sleep(RENDER_WAIT);

    // Type and submit
    stdin.write('hello');
    await Bun.sleep(RENDER_WAIT);
    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('waiting for agent...');
  });

  test('typing "exit" calls onExit', async () => {
    const store = new SessionStore();
    const onExit = mock();
    const conn = makeMockConnection();

    const { stdin } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={onExit}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('exit');
    await Bun.sleep(RENDER_WAIT);
    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);

    expect(onExit).toHaveBeenCalled();
    // prompt should NOT be called for exit
    expect(conn.prompt).not.toHaveBeenCalled();
  });

  test('typing "quit" calls onExit', async () => {
    const store = new SessionStore();
    const onExit = mock();
    const conn = makeMockConnection();

    const { stdin } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={onExit}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('quit');
    await Bun.sleep(RENDER_WAIT);
    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);

    expect(onExit).toHaveBeenCalled();
    expect(conn.prompt).not.toHaveBeenCalled();
  });

  test('renders multiple messages from history', async () => {
    const store = new SessionStore();
    const conn = makeMockConnection();

    const { stdin, lastFrame } = render(
      <Chat
        engine="claude-code"
        model="opus"
        sessionId="session-1"
        connection={conn as any}
        store={store}
        onExit={() => {}}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('first question');
    await Bun.sleep(RENDER_WAIT);
    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);
    store.emit('agent-message-chunk', 'first answer');
    await Bun.sleep(RENDER_WAIT);
    store.emit('turn-end', 'end_turn');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('You');
    expect(frame).toContain('Agent');
  });
});
