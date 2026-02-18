import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { ThoughtBlock } from './ThoughtBlock.tsx';

describe('ThoughtBlock', () => {
  test('renders thought emoji and text', () => {
    const { lastFrame } = render(<ThoughtBlock text="Analyzing the code..." />);
    const frame = lastFrame()!;
    expect(frame).toContain('💭');
    expect(frame).toContain('Analyzing the code...');
  });

  test('returns null for empty text', () => {
    const { lastFrame } = render(<ThoughtBlock text="" />);
    // When returning null, ink renders nothing
    expect(lastFrame()).toBe('');
  });

  test('renders multiline thoughts', () => {
    const { lastFrame } = render(
      <ThoughtBlock text="First thought\nSecond thought" />,
    );
    const frame = lastFrame()!;
    expect(frame).toContain('First thought');
    expect(frame).toContain('Second thought');
  });
});
