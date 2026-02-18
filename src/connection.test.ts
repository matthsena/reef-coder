import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { PassThrough } from 'node:stream';
import { SessionStore } from './store.ts';

// Store captured calls for verification
let spawnCalls: Array<{ command: string; args: string[]; options: any }> = [];
let mockKill: ReturnType<typeof mock>;

const mockInitialize = mock(() =>
  Promise.resolve({ protocolVersion: '2024-11-05' }),
);
const mockNewSession = mock(() =>
  Promise.resolve({
    sessionId: 'session-abc123',
    models: {
      availableModels: [
        { modelId: 'model-a' },
        { modelId: 'model-b' },
      ],
      currentModelId: 'model-a',
    },
  }),
);
const mockPrompt = mock(() => Promise.resolve({ stopReason: 'end_turn' }));
const mockUnstableSetSessionModel = mock(() => Promise.resolve());

mock.module('node:child_process', () => ({
  spawn: mock((...args: any[]) => {
    spawnCalls.push({
      command: args[0],
      args: args[1],
      options: args[2],
    });
    // Use real PassThrough streams so Writable.toWeb / Readable.toWeb work
    const fakeStdin = new PassThrough();
    const fakeStdout = new PassThrough();
    // End stdout immediately so the stream is valid
    fakeStdout.end();
    return {
      stdin: fakeStdin,
      stdout: fakeStdout,
      stderr: null,
      pid: 12345,
      kill: mockKill,
      once: mock((_event: string, cb: () => void) => {
        cb();
      }),
    };
  }),
}));

// Mock the ACP SDK with a class-based ClientSideConnection
mock.module('@agentclientprotocol/sdk', () => {
  class MockClientSideConnection {
    initialize = mockInitialize;
    newSession = mockNewSession;
    prompt = mockPrompt;
    unstable_setSessionModel = mockUnstableSetSessionModel;
    constructor(_clientFactory: any, _stream: any) {}
  }

  return {
    PROTOCOL_VERSION: '2024-11-05',
    ndJsonStream: mock(() => ({})),
    ClientSideConnection: MockClientSideConnection,
  };
});

mock.module('@agentclientprotocol/sdk/dist/schema/zod.gen.js', () => ({
  zSessionNotification: {
    safeParse: mock(() => ({ success: true, data: {} })),
  },
}));

// Import after mocks are set up
const { createConnection, setSessionModel } = await import('./connection.ts');

describe('createConnection', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
    spawnCalls = [];
    mockKill = mock();
    mockInitialize.mockClear();
    mockNewSession.mockClear();
  });

  test('spawns the executable with correct args', async () => {
    await createConnection('claude-code-acp', ['--flag'], '/tmp', store);
    expect(spawnCalls).toHaveLength(1);
    expect(spawnCalls[0]!.command).toBe('claude-code-acp');
    expect(spawnCalls[0]!.args).toEqual(['--flag']);
  });

  test('appends modelFlag when provided', async () => {
    await createConnection(
      'gemini',
      ['--experimental-acp'],
      '/tmp',
      store,
      { flag: '-m', value: 'gemini-2.5-flash' },
    );
    expect(spawnCalls[0]!.args).toEqual([
      '--experimental-acp',
      '-m',
      'gemini-2.5-flash',
    ]);
  });

  test('emits connection-status events during startup', async () => {
    const statuses: string[] = [];
    store.on('connection-status', (msg) => statuses.push(msg));

    await createConnection('test-exec', [], '/tmp', store);

    expect(statuses).toContain('Spawning test-exec...');
    expect(statuses.some((s) => s.includes('Connected'))).toBe(true);
    expect(statuses.some((s) => s.includes('Session'))).toBe(true);
    expect(statuses.some((s) => s.includes('Current model'))).toBe(true);
  });

  test('returns connection, sessionId, availableModels, currentModelId', async () => {
    const result = await createConnection('test', [], '/tmp', store);

    expect(result.sessionId).toBe('session-abc123');
    expect(result.availableModels).toEqual([
      { modelId: 'model-a' },
      { modelId: 'model-b' },
    ]);
    expect(result.currentModelId).toBe('model-a');
    expect(result.connection).toBeDefined();
    expect(result.shutdown).toBeFunction();
  });

  test('shutdown kills the agent process', async () => {
    const result = await createConnection('test', [], '/tmp', store);
    await result.shutdown();
    expect(mockKill).toHaveBeenCalledWith('SIGTERM');
  });
});

describe('setSessionModel', () => {
  test('calls unstable_setSessionModel and emits status', async () => {
    const store = new SessionStore();
    const statuses: string[] = [];
    store.on('connection-status', (msg) => statuses.push(msg));

    const mockConn = {
      unstable_setSessionModel: mock(() => Promise.resolve()),
    };
    await setSessionModel(mockConn as any, 'session-1', 'new-model', store);

    expect(mockConn.unstable_setSessionModel).toHaveBeenCalledWith({
      sessionId: 'session-1',
      modelId: 'new-model',
    });
    expect(statuses).toContain('Model set to: new-model');
  });
});
