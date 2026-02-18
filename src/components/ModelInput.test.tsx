import { describe, expect, test, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { ModelInput } from './ModelInput.tsx';

const ENTER = '\r';

describe('ModelInput', () => {
  test('shows engine label with branding', () => {
    const { lastFrame } = render(
      <ModelInput engine="gemini" defaultModel="gemini-2.5-flash" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('Gemini CLI');
  });

  test('shows "Enter model name:" prompt', () => {
    const { lastFrame } = render(
      <ModelInput engine="gemini" defaultModel="model" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('Enter model name:');
  });

  test('shows default model value', () => {
    const { lastFrame } = render(
      <ModelInput engine="gemini" defaultModel="gemini-2.5-flash" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('gemini-2.5-flash');
  });

  test('shows confirm hint', () => {
    const { lastFrame } = render(
      <ModelInput engine="gemini" defaultModel="model" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('⏎ confirm');
  });

  test('submits default model on enter', async () => {
    const onSubmit = mock();
    const { stdin } = render(
      <ModelInput engine="gemini" defaultModel="gemini-2.5-flash" onSubmit={onSubmit} />,
    );

    stdin.write(ENTER);
    await Bun.sleep(50);

    expect(onSubmit).toHaveBeenCalledWith('gemini-2.5-flash');
  });

  test('does not submit when value is empty', async () => {
    const onSubmit = mock();
    const { stdin } = render(
      <ModelInput engine="gemini" defaultModel="" onSubmit={onSubmit} />,
    );

    stdin.write(ENTER);
    await Bun.sleep(50);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('falls back to engine key when no label exists', () => {
    const { lastFrame } = render(
      <ModelInput engine="unknown" defaultModel="m" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('unknown');
  });

  test('shows > prompt character', () => {
    const { lastFrame } = render(
      <ModelInput engine="gemini" defaultModel="test" onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('>');
  });
});
