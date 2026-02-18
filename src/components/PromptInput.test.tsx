import { describe, expect, test, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { PromptInput } from './PromptInput.tsx';

const RENDER_WAIT = 100;

describe('PromptInput', () => {
  test('shows "You> " label when enabled', () => {
    const { lastFrame } = render(
      <PromptInput disabled={false} onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('You');
    expect(lastFrame()!).toContain('>');
  });

  test('shows waiting message when disabled', () => {
    const { lastFrame } = render(
      <PromptInput disabled={true} onSubmit={() => {}} />,
    );
    expect(lastFrame()!).toContain('waiting for agent...');
  });

  test('does not show waiting message when enabled', () => {
    const { lastFrame } = render(
      <PromptInput disabled={false} onSubmit={() => {}} />,
    );
    expect(lastFrame()!).not.toContain('waiting for agent...');
  });

  test('renders input area when enabled', async () => {
    const onSubmit = mock();
    const { stdin, lastFrame } = render(
      <PromptInput disabled={false} onSubmit={onSubmit} />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('hello');
    await Bun.sleep(RENDER_WAIT);

    const frame = lastFrame()!;
    expect(frame).toContain('hello');
  });

  test('submits trimmed text on enter', async () => {
    const onSubmit = mock();
    const { stdin } = render(
      <PromptInput disabled={false} onSubmit={onSubmit} />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('test input');
    await Bun.sleep(RENDER_WAIT);
    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);

    expect(onSubmit).toHaveBeenCalledWith('test input');
  });

  test('does not submit empty input', async () => {
    const onSubmit = mock();
    const { stdin } = render(
      <PromptInput disabled={false} onSubmit={onSubmit} />,
    );
    await Bun.sleep(RENDER_WAIT);

    stdin.write('\r');
    await Bun.sleep(RENDER_WAIT);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
