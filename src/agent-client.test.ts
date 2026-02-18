import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { AgentClient } from './agent-client.ts';
import { SessionStore } from './store.ts';
import { TerminalManager } from './terminal-manager.ts';

describe('AgentClient', () => {
  let store: SessionStore;
  let terminals: TerminalManager;
  let workdir: string;
  let client: AgentClient;

  beforeEach(async () => {
    store = new SessionStore();
    terminals = new TerminalManager();
    workdir = join('/tmp', `agent-client-test-${Date.now()}`);
    await mkdir(workdir, { recursive: true });
    client = new AgentClient(terminals, workdir, store);
  });

  afterEach(async () => {
    // Clean up test directory
    const { rm } = await import('node:fs/promises');
    await rm(workdir, { recursive: true, force: true });
  });

  describe('sessionUpdate', () => {
    test('routes agent_message_chunk with text content', async () => {
      const handler = mock<(text: string) => void>();
      store.on('agent-message-chunk', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'agent_message_chunk',
          content: { type: 'text', text: 'Hello world' },
        },
      } as any);

      expect(handler).toHaveBeenCalledWith('Hello world');
    });

    test('routes agent_message_chunk with non-text content', async () => {
      const handler = mock<(text: string) => void>();
      store.on('agent-message-chunk', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'agent_message_chunk',
          content: { type: 'image' },
        },
      } as any);

      expect(handler).toHaveBeenCalledWith('[image]');
    });

    test('routes agent_thought_chunk', async () => {
      const handler = mock<(text: string) => void>();
      store.on('agent-thought-chunk', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'agent_thought_chunk',
          content: { type: 'text', text: 'Thinking...' },
        },
      } as any);

      expect(handler).toHaveBeenCalledWith('Thinking...');
    });

    test('ignores agent_thought_chunk with non-text content', async () => {
      const handler = mock<(text: string) => void>();
      store.on('agent-thought-chunk', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'agent_thought_chunk',
          content: { type: 'image' },
        },
      } as any);

      expect(handler).not.toHaveBeenCalled();
    });

    test('routes tool_call', async () => {
      const handler = mock<(entry: any) => void>();
      store.on('tool-call', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'tool_call',
          toolCallId: 'tc-1',
          title: 'Read file',
          status: 'started',
        },
      } as any);

      expect(handler).toHaveBeenCalledWith({
        id: 'tc-1',
        title: 'Read file',
        status: 'started',
      });
    });

    test('routes tool_call with missing status defaults to started', async () => {
      const handler = mock<(entry: any) => void>();
      store.on('tool-call', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'tool_call',
          toolCallId: 'tc-2',
          title: 'Write file',
        },
      } as any);

      expect(handler).toHaveBeenCalledWith({
        id: 'tc-2',
        title: 'Write file',
        status: 'started',
      });
    });

    test('routes tool_call_update', async () => {
      const handler = mock<(id: string, status: string) => void>();
      store.on('tool-call-update', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'tool_call_update',
          toolCallId: 'tc-1',
          status: 'completed',
        },
      } as any);

      expect(handler).toHaveBeenCalledWith('tc-1', 'completed');
    });

    test('routes tool_call_update with missing status', async () => {
      const handler = mock<(id: string, status: string) => void>();
      store.on('tool-call-update', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'tool_call_update',
          toolCallId: 'tc-1',
        },
      } as any);

      expect(handler).toHaveBeenCalledWith('tc-1', 'unknown');
    });

    test('routes plan', async () => {
      const handler = mock<(entries: any[]) => void>();
      store.on('plan', handler);

      await client.sessionUpdate({
        sessionId: 'test',
        update: {
          sessionUpdate: 'plan',
          entries: [
            { status: 'completed', content: 'Step 1' },
            { status: 'in-progress', content: 'Step 2' },
          ],
        },
      } as any);

      expect(handler).toHaveBeenCalledWith([
        { status: 'completed', content: 'Step 1' },
        { status: 'in-progress', content: 'Step 2' },
      ]);
    });
  });

  describe('requestPermission', () => {
    test('auto-accepts the first option and emits permission event', async () => {
      const handler = mock<(msg: string) => void>();
      store.on('permission', handler);

      const result = await client.requestPermission({
        toolCall: { title: 'Run command' },
        options: [
          { optionId: 'opt-1', name: 'Allow', kind: 'allow' },
          { optionId: 'opt-2', name: 'Deny', kind: 'deny' },
        ],
      } as any);

      expect(result.outcome).toEqual({
        outcome: 'selected',
        optionId: 'opt-1',
      });
      expect(handler).toHaveBeenCalledWith(
        'Auto-accepting: "Allow" (allow) for Run command',
      );
    });
  });

  describe('workdir boundary checks', () => {
    test('readTextFile within workdir succeeds', async () => {
      const filePath = join(workdir, 'test.txt');
      await writeFile(filePath, 'content');

      const result = await client.readTextFile({ path: filePath } as any);
      expect(result.content).toBe('content');
    });

    test('readTextFile outside workdir throws', async () => {
      await expect(
        client.readTextFile({ path: '/etc/passwd' } as any),
      ).rejects.toThrow('Access denied');
    });

    test('writeTextFile within workdir succeeds', async () => {
      const filePath = join(workdir, 'output.txt');
      await client.writeTextFile({
        path: filePath,
        content: 'written',
      } as any);

      const { readFile } = await import('node:fs/promises');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toBe('written');
    });

    test('writeTextFile outside workdir throws', async () => {
      await expect(
        client.writeTextFile({
          path: '/tmp/outside-workdir.txt',
          content: 'bad',
        } as any),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('terminal delegation', () => {
    test('createTerminal delegates to TerminalManager', async () => {
      const result = await client.createTerminal({
        command: 'echo',
        args: ['test'],
        cwd: workdir,
      } as any);
      expect(result.terminalId).toMatch(/^term-/);
    });

    test('createTerminal uses workdir as default cwd', async () => {
      const result = await client.createTerminal({
        command: 'pwd',
        args: [],
      } as any);
      expect(result.terminalId).toMatch(/^term-/);
    });

    test('createTerminal rejects cwd outside workdir', async () => {
      await expect(
        client.createTerminal({
          command: 'ls',
          args: [],
          cwd: '/etc',
        } as any),
      ).rejects.toThrow('Access denied');
    });

    test('terminalOutput delegates to TerminalManager', async () => {
      const { terminalId } = await client.createTerminal({
        command: 'echo',
        args: ['output-test'],
        cwd: workdir,
      } as any);

      await client.waitForTerminalExit({ terminalId } as any);
      const result = await client.terminalOutput({ terminalId } as any);
      expect(result.output).toContain('output-test');
    });

    test('killTerminal delegates to TerminalManager', async () => {
      const { terminalId } = await client.createTerminal({
        command: 'sleep',
        args: ['60'],
        cwd: workdir,
      } as any);

      const result = await client.killTerminal({ terminalId } as any);
      expect(result).toEqual({});
    });

    test('releaseTerminal delegates to TerminalManager', async () => {
      const { terminalId } = await client.createTerminal({
        command: 'sleep',
        args: ['60'],
        cwd: workdir,
      } as any);

      const result = await client.releaseTerminal({ terminalId } as any);
      expect(result).toEqual({});
    });
  });
});
