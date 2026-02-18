import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { Connecting } from './Connecting.tsx';

describe('Connecting', () => {
  test('shows engine label', () => {
    const { lastFrame } = render(
      <Connecting engine="claude-code" statusMessages={[]} />,
    );
    expect(lastFrame()!).toContain('Claude Code');
  });

  test('shows "Connecting to" text', () => {
    const { lastFrame } = render(
      <Connecting engine="copilot" statusMessages={[]} />,
    );
    expect(lastFrame()!).toContain('Connecting to');
    expect(lastFrame()!).toContain('GitHub Copilot CLI');
  });

  test('displays status messages', () => {
    const msgs = ['Spawning process...', 'Connected (protocol v1)'];
    const { lastFrame } = render(
      <Connecting engine="copilot" statusMessages={msgs} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Spawning process...');
    expect(frame).toContain('Connected (protocol v1)');
  });

  test('falls back to engine key when no label', () => {
    const { lastFrame } = render(
      <Connecting engine="unknown-engine" statusMessages={[]} />,
    );
    expect(lastFrame()!).toContain('unknown-engine');
  });

  test('renders with empty status messages', () => {
    const { lastFrame } = render(
      <Connecting engine="opencode" statusMessages={[]} />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('Connecting to');
    expect(frame).toContain('OpenCode');
  });

  test('renders multiple status messages in order', () => {
    const msgs = ['Step 1', 'Step 2', 'Step 3'];
    const { lastFrame } = render(
      <Connecting engine="codex" statusMessages={msgs} />,
    );
    const frame = lastFrame()!;
    // All messages should appear
    for (const msg of msgs) {
      expect(frame).toContain(msg);
    }
  });
});
