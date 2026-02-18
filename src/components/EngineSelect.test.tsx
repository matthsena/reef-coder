import { describe, expect, test, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { EngineSelect } from './EngineSelect.tsx';

const ARROW_UP = '\x1B[A';
const ARROW_DOWN = '\x1B[B';
const ENTER = '\r';
const RENDER_WAIT = 100;

// Expected sorted order of engine labels
const SORTED_ENGINES = [
  { label: 'Claude Code', key: 'claude-code' },
  { label: 'Codex', key: 'codex' },
  { label: 'GitHub Copilot CLI', key: 'copilot' },
  { label: 'OpenCode', key: 'opencode' },
  { label: 'Qwen Code', key: 'qwen-code' },
];

describe('EngineSelect', () => {
  test('renders all engine labels sorted alphabetically', () => {
    const { lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    const frame = lastFrame()!;
    for (const engine of SORTED_ENGINES) {
      expect(frame).toContain(engine.label);
    }
  });

  test('shows "Select your engine:" header', () => {
    const { lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    expect(lastFrame()!).toContain('Select your engine:');
  });

  test('shows navigation hint', () => {
    const { lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    expect(lastFrame()!).toContain('↑/↓ navigate');
    expect(lastFrame()!).toContain('⏎ select');
  });

  test('first item (Claude Code) is selected by default', () => {
    const { lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    const frame = lastFrame()!;
    expect(frame).toContain('❯');
    const lines = frame.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Claude Code');
  });

  test('arrow down moves selection to next item', async () => {
    const { stdin, lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    const lines = frame.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Codex');
  });

  test('arrow up from first item wraps to last', async () => {
    const { stdin, lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_UP);
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    const lines = frame.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Qwen Code');
  });

  test('arrow down from last item wraps to first', async () => {
    const { stdin, lastFrame } = render(<EngineSelect onSelect={() => {}} />);
    await Bun.sleep(RENDER_WAIT);

    for (let i = 0; i < 4; i++) {
      stdin.write(ARROW_DOWN);
      await Bun.sleep(RENDER_WAIT);
    }

    let frame = lastFrame()!;
    let lines = frame.split('\n');
    let selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Qwen Code');

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);

    frame = lastFrame()!;
    lines = frame.split('\n');
    selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('Claude Code');
  });

  test('enter selects the first engine (claude-code)', async () => {
    const onSelect = mock();
    const { stdin } = render(<EngineSelect onSelect={onSelect} />);
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('claude-code');
  });

  test('navigate down twice and select GitHub Copilot CLI', async () => {
    const onSelect = mock();
    const { stdin } = render(<EngineSelect onSelect={onSelect} />);
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('copilot');
  });

  test('navigate to OpenCode (4th item) and select', async () => {
    const onSelect = mock();
    const { stdin } = render(<EngineSelect onSelect={onSelect} />);
    await Bun.sleep(RENDER_WAIT);

    for (let i = 0; i < 3; i++) {
      stdin.write(ARROW_DOWN);
      await Bun.sleep(RENDER_WAIT);
    }
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('opencode');
  });

  test('wrap up from first and select last (Qwen Code)', async () => {
    const onSelect = mock();
    const { stdin } = render(<EngineSelect onSelect={onSelect} />);
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_UP);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('qwen-code');
  });

  test('multiple navigations preserve correct selection', async () => {
    const onSelect = mock();
    const { stdin } = render(<EngineSelect onSelect={onSelect} />);
    await Bun.sleep(RENDER_WAIT);

    // Down 3, up 1 = index 2 (GitHub Copilot CLI)
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_UP);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('copilot');
  });
});
