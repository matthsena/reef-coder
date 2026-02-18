import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { StatusBar } from './StatusBar.tsx';

describe('StatusBar', () => {
  test('displays engine label', () => {
    const { lastFrame } = render(
      <StatusBar engine="claude-code" model="opus" sessionId="abcdef1234567890" />,
    );
    expect(lastFrame()!).toContain('Claude Code');
  });

  test('displays model name', () => {
    const { lastFrame } = render(
      <StatusBar engine="copilot" model="claude-sonnet-4.6" sessionId="session123" />,
    );
    expect(lastFrame()!).toContain('claude-sonnet-4.6');
  });

  test('truncates session ID to 8 characters', () => {
    const { lastFrame } = render(
      <StatusBar engine="copilot" model="gpt-4o" sessionId="abcdef1234567890" />,
    );
    expect(lastFrame()!).toContain('abcdef12');
    expect(lastFrame()!).not.toContain('abcdef1234567890');
  });

  test('falls back to engine key when no label exists', () => {
    const { lastFrame } = render(
      <StatusBar engine="unknown-engine" model="m" sessionId="sess1234" />,
    );
    expect(lastFrame()!).toContain('unknown-engine');
  });

  test('shows separators', () => {
    const { lastFrame } = render(
      <StatusBar engine="claude-code" model="opus" sessionId="12345678" />,
    );
    expect(lastFrame()!).toContain('│');
  });

  test('shows session: prefix', () => {
    const { lastFrame } = render(
      <StatusBar engine="opencode" model="big-pickle" sessionId="sess9999abcd" />,
    );
    expect(lastFrame()!).toContain('session:');
  });
});
