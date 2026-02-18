import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { render } from 'ink-testing-library';

const ARROW_DOWN = '\x1B[B';
const ENTER = '\r';
const W = 200; // render wait — enough for React/ink even under --coverage

// --- Mocks ---
const mockPrompt = mock(() => Promise.resolve({ stopReason: 'end_turn' }));
const mockShutdown = mock(() => Promise.resolve());

// Resolve callbacks for controlling async connection flow
let resolveConnection: (value: any) => void;
let rejectConnection: (reason: any) => void;

const mockCreateConnection = mock(
  () =>
    new Promise((resolve, reject) => {
      resolveConnection = resolve;
      rejectConnection = reject;
    }),
);

const mockSetSessionModelFn = mock(() => Promise.resolve());

mock.module('../connection.ts', () => ({
  createConnection: mockCreateConnection,
  setSessionModel: mockSetSessionModelFn,
}));

// Import App after mocks
const { App } = await import('./App.tsx');

function makeConnectionResult(overrides: Record<string, any> = {}) {
  return {
    connection: {
      prompt: mockPrompt,
      unstable_setSessionModel: mock(),
    },
    sessionId: 'test-session-id-12345678',
    availableModels: [],
    currentModelId: null,
    shutdown: mockShutdown,
    ...overrides,
  };
}

describe('App E2E', () => {
  beforeEach(() => {
    // Restore default implementation (deferred promise) before each test
    mockCreateConnection.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveConnection = resolve;
          rejectConnection = reject;
        }),
    );
    mockCreateConnection.mockClear();
    mockSetSessionModelFn.mockClear();
    mockPrompt.mockClear();
    mockShutdown.mockClear();
  });

  test('starts on engine-select screen', () => {
    const { lastFrame } = render(<App workdir="/tmp" />);
    const frame = lastFrame()!;
    expect(frame).toContain('Select your engine:');
    expect(frame).toContain('Claude Code');
    expect(frame).toContain('Gemini CLI');
  });

  test('navigate engines with keyboard', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    let frame = lastFrame()!;
    let selectorLine = frame.split('\n').find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Claude Code');

    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);

    frame = lastFrame()!;
    selectorLine = frame.split('\n').find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Codex');
  });

  test('selecting engine shows connecting screen', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Connecting to');
    expect(frame).toContain('Claude Code');
  });

  test('engine-select → connecting → chat (no models, no modelFlag)', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    expect(lastFrame()!).toContain('Connecting to');

    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Claude Code');
    expect(frame).toContain('You');
    expect(frame).toContain('>');
  });

  test('engine-select → connecting → model-select → chat (with models)', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    resolveConnection(
      makeConnectionResult({
        availableModels: [
          { modelId: 'model-a' },
          { modelId: 'model-b' },
          { modelId: 'model-c' },
        ],
        currentModelId: 'model-a',
      }),
    );
    await Bun.sleep(W);

    let frame = lastFrame()!;
    expect(frame).toContain('Select model:');
    expect(frame).toContain('model-a (current)');
    expect(frame).toContain('model-b');
    expect(frame).toContain('model-c');

    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ENTER);
    await Bun.sleep(W);

    expect(mockSetSessionModelFn).toHaveBeenCalled();

    await Bun.sleep(W);
    frame = lastFrame()!;
    expect(frame).toContain('You');
    expect(frame).toContain('>');
  });

  test('engine-select → connecting → model-input (engine with modelFlag)', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    // Navigate to Gemini CLI (index 2)
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ENTER);
    await Bun.sleep(W);

    expect(lastFrame()!).toContain('Connecting to');
    expect(lastFrame()!).toContain('Gemini CLI');

    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Enter model name:');
    expect(frame).toContain('Gemini CLI');
  });

  test('model-input submits and reconnects with modelFlag', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    // Navigate to Gemini CLI
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ENTER);
    await Bun.sleep(W);

    // First connection resolves
    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    // On model-input screen, the default model is pre-filled
    expect(lastFrame()!).toContain('gemini-2.5-flash');

    // Submit default model
    stdin.write(ENTER);
    await Bun.sleep(W);

    // Should show connecting again (reconnecting)
    expect(lastFrame()!).toContain('Reconnecting');

    // Resolve the second connection
    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    // Should be in chat now
    const frame = lastFrame()!;
    expect(frame).toContain('You');
    expect(frame).toContain('>');
  });

  test('connection error shows error message', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    rejectConnection(new Error('Connection refused'));
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Error: Connection refused');
  });

  test('connection error with non-Error object', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    rejectConnection({ code: 'ENOENT' });
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Error:');
    expect(frame).toContain('ENOENT');
  });

  test('full flow: select engine → connect → chat → type message', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    stdin.write('Hello agent');
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Hello agent');
  });

  test('keyboard navigation through all engines', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    const expectedOrder = [
      'Claude Code',
      'Codex',
      'Gemini CLI',
      'GitHub Copilot CLI',
      'OpenCode',
      'Qwen Code',
    ];

    let frame = lastFrame()!;
    let selectorLine = frame.split('\n').find((l) => l.includes('❯'));
    expect(selectorLine).toContain(expectedOrder[0]!);

    for (let i = 1; i < expectedOrder.length; i++) {
      stdin.write(ARROW_DOWN);
      await Bun.sleep(W);
      frame = lastFrame()!;
      selectorLine = frame.split('\n').find((l) => l.includes('❯'));
      expect(selectorLine).toContain(expectedOrder[i]!);
    }

    // Wrap around back to first
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    frame = lastFrame()!;
    selectorLine = frame.split('\n').find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Claude Code');
  });

  test('selecting different engines passes correct key', async () => {
    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    // Navigate to OpenCode (index 4)
    for (let i = 0; i < 4; i++) {
      stdin.write(ARROW_DOWN);
      await Bun.sleep(W);
    }

    const frame = lastFrame()!;
    const selectorLine = frame.split('\n').find((l) => l.includes('❯'));
    expect(selectorLine).toContain('OpenCode');

    stdin.write(ENTER);
    await Bun.sleep(W);

    expect(lastFrame()!).toContain('OpenCode');
  });

  test('model-input reconnect error shows error message', async () => {
    // First call succeeds (initial connect), second call rejects (reconnect)
    let callCount = 0;
    mockCreateConnection.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          callCount++;
          if (callCount === 1) {
            resolveConnection = resolve;
            rejectConnection = reject;
          } else {
            // Second call (reconnect) — reject
            reject(new Error('Reconnect failed'));
          }
        }),
    );

    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    // Navigate to Gemini CLI (has modelFlag)
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(W);
    stdin.write(ENTER);
    await Bun.sleep(W);

    // First connection succeeds
    resolveConnection(makeConnectionResult());
    await Bun.sleep(W);

    // On model-input, submit
    stdin.write(ENTER);
    await Bun.sleep(W);

    // The reconnect rejects immediately
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Error: Reconnect failed');
  });

  test('model-select error shows error message', async () => {
    mockSetSessionModelFn.mockImplementationOnce(() =>
      Promise.reject(new Error('Model not found')),
    );

    const { stdin, lastFrame } = render(<App workdir="/tmp" />);
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    resolveConnection(
      makeConnectionResult({
        availableModels: [{ modelId: 'bad-model' }],
      }),
    );
    await Bun.sleep(W);

    stdin.write(ENTER);
    await Bun.sleep(W);

    const frame = lastFrame()!;
    expect(frame).toContain('Error setting model: Model not found');
  });
});
