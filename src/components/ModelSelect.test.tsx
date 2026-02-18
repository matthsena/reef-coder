import { describe, expect, test, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { ModelSelect } from './ModelSelect.tsx';

const ARROW_UP = '\x1B[A';
const ARROW_DOWN = '\x1B[B';
const ENTER = '\r';
const RENDER_WAIT = 100;

const MODELS = [
  { modelId: 'model-alpha' },
  { modelId: 'model-beta' },
  { modelId: 'model-gamma' },
];

describe('ModelSelect', () => {
  test('renders "Select model:" header', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="claude-code"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()!).toContain('Select model:');
  });

  test('renders engine label', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="claude-code"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()!).toContain('Claude Code');
  });

  test('renders all model IDs', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="copilot"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('model-alpha');
    expect(frame).toContain('model-beta');
    expect(frame).toContain('model-gamma');
  });

  test('marks current model with "(current)" suffix', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="copilot"
        availableModels={MODELS}
        currentModelId="model-beta"
        onSelect={() => {}}
      />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('model-beta (current)');
    expect(frame).not.toContain('model-alpha (current)');
  });

  test('first item is selected by default', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    const frame = lastFrame()!;
    const lines = frame.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('model-alpha');
  });

  test('arrow down moves to next item', async () => {
    const { stdin, lastFrame } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);

    const lines = lastFrame()!.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('model-beta');
  });

  test('arrow up wraps from first to last', async () => {
    const { stdin, lastFrame } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_UP);
    await Bun.sleep(RENDER_WAIT);

    const lines = lastFrame()!.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('model-gamma');
  });

  test('arrow down wraps from last to first', async () => {
    const { stdin, lastFrame } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);

    const lines = lastFrame()!.split('\n');
    const selectorLine = lines.find((l) => l.includes('❯'));
    expect(selectorLine).toContain('model-alpha');
  });

  test('enter selects first model by default', async () => {
    const onSelect = mock();
    const { stdin } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={onSelect}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('model-alpha');
  });

  test('navigate and select second model', async () => {
    const onSelect = mock();
    const { stdin } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={onSelect}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_DOWN);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('model-beta');
  });

  test('navigate up from first and select last model', async () => {
    const onSelect = mock();
    const { stdin } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={onSelect}
      />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write(ARROW_UP);
    await Bun.sleep(RENDER_WAIT);
    stdin.write(ENTER);
    await Bun.sleep(RENDER_WAIT);

    expect(onSelect).toHaveBeenCalledWith('model-gamma');
  });

  test('shows navigation hint', () => {
    const { lastFrame } = render(
      <ModelSelect
        engine="opencode"
        availableModels={MODELS}
        currentModelId={null}
        onSelect={() => {}}
      />,
    );
    expect(lastFrame()!).toContain('↑/↓ navigate');
    expect(lastFrame()!).toContain('⏎ select');
  });
});
