import { describe, expect, test } from 'bun:test';
import { TerminalManager } from './terminal-manager.ts';

describe('TerminalManager', () => {
  test('create returns a terminal ID', () => {
    const tm = new TerminalManager();
    const id = tm.create('echo', ['hello'], '/tmp');
    expect(id).toMatch(/^term-\d+$/);
  });

  test('IDs are unique and incrementing', () => {
    const tm = new TerminalManager();
    const id1 = tm.create('echo', ['a'], '/tmp');
    const id2 = tm.create('echo', ['b'], '/tmp');
    expect(id1).not.toBe(id2);
    const num1 = parseInt(id1.replace('term-', ''));
    const num2 = parseInt(id2.replace('term-', ''));
    expect(num2).toBe(num1 + 1);
  });

  test('getOutput returns output from a completed process', async () => {
    const tm = new TerminalManager();
    const id = tm.create('echo', ['hello world'], '/tmp');
    await tm.waitForExit(id);
    const result = tm.getOutput(id);
    expect(result.output).toContain('hello world');
    expect(result.truncated).toBe(false);
    expect(result.exitStatus).toBeDefined();
    expect(result.exitStatus!.exitCode).toBe(0);
  });

  test('getOutput before process exits has no exitStatus', async () => {
    const tm = new TerminalManager();
    const id = tm.create('sleep', ['10'], '/tmp');
    const result = tm.getOutput(id);
    expect(result.exitStatus).toBeUndefined();
    tm.kill(id);
    await tm.waitForExit(id);
  });

  test('waitForExit resolves with exit code', async () => {
    const tm = new TerminalManager();
    const id = tm.create('true', [], '/tmp');
    const result = await tm.waitForExit(id);
    expect(result.exitCode).toBe(0);
    expect(result.signal).toBeNull();
  });

  test('waitForExit with non-zero exit code', async () => {
    const tm = new TerminalManager();
    const id = tm.create('false', [], '/tmp');
    const result = await tm.waitForExit(id);
    expect(result.exitCode).not.toBe(0);
  });

  test('kill sends SIGTERM', async () => {
    const tm = new TerminalManager();
    const id = tm.create('sleep', ['60'], '/tmp');
    tm.kill(id);
    const result = await tm.waitForExit(id);
    // Process was killed, signal should be set
    expect(result.signal).toBeDefined();
  });

  test('release removes terminal and kills if still running', async () => {
    const tm = new TerminalManager();
    const id = tm.create('sleep', ['60'], '/tmp');
    await tm.release(id);
    // After release, getting output should throw
    expect(() => tm.getOutput(id)).toThrow(`Terminal ${id} not found`);
  });

  test('release is a no-op for non-existent terminal', async () => {
    const tm = new TerminalManager();
    // Should not throw
    await tm.release('term-999');
  });

  test('release on already-exited terminal removes without error', async () => {
    const tm = new TerminalManager();
    const id = tm.create('echo', ['done'], '/tmp');
    await tm.waitForExit(id);
    await tm.release(id);
    expect(() => tm.getOutput(id)).toThrow();
  });

  test('get throws for unknown terminal', () => {
    const tm = new TerminalManager();
    expect(() => tm.getOutput('term-unknown')).toThrow(
      'Terminal term-unknown not found',
    );
  });

  test('captures stderr output', async () => {
    const tm = new TerminalManager();
    // ls on a nonexistent path writes an error to stderr
    const id = tm.create('ls', ['/nonexistent_path_xyz_test_12345'], '/tmp');
    await tm.waitForExit(id);
    const result = tm.getOutput(id);
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output).toContain('nonexistent_path_xyz_test_12345');
  });

  test('output truncated flag is set when output exceeds 1 MB', async () => {
    const tm = new TerminalManager();
    // Generate more than 1MB of output using yes piped through head
    // yes outputs "y\n" repeatedly; head -c limits bytes
    const id = tm.create('head', ['-c', '1100000', '/dev/zero'], '/tmp');
    await tm.waitForExit(id);
    const result = tm.getOutput(id);
    expect(result.truncated).toBe(true);
    expect(result.output.length).toBeLessThanOrEqual(1024 * 1024);
  });

  test('captures both stdout and stderr streams', async () => {
    const tm = new TerminalManager();
    // Verify stdout is captured
    const id1 = tm.create('echo', ['stdout_marker'], '/tmp');
    await tm.waitForExit(id1);
    expect(tm.getOutput(id1).output).toContain('stdout_marker');

    // Verify stderr is captured (ls on nonexistent path writes to stderr)
    const id2 = tm.create('ls', ['/no_such_path_abc_99'], '/tmp');
    await tm.waitForExit(id2);
    expect(tm.getOutput(id2).output).toContain('no_such_path_abc_99');
  });
});
