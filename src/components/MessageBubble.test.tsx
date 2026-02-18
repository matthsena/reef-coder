import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { MessageBubble } from './MessageBubble.tsx';
import type { ChatMessage } from '../types.ts';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    role: 'agent',
    text: '',
    thoughts: '',
    toolCalls: [],
    plan: [],
    timestamp: '14:30:00',
    ...overrides,
  };
}

describe('MessageBubble', () => {
  test('renders user message with "You" label', () => {
    const msg = makeMessage({ role: 'user', text: 'Hello' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    const frame = lastFrame()!;
    expect(frame).toContain('You');
    expect(frame).toContain('Hello');
  });

  test('renders agent message with "Agent" label', () => {
    const msg = makeMessage({ role: 'agent', text: 'Hi there' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Agent');
    expect(frame).toContain('Hi there');
  });

  test('displays timestamp', () => {
    const msg = makeMessage({ timestamp: '09:15:30' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    expect(lastFrame()!).toContain('09:15:30');
  });

  test('renders thoughts block when present', () => {
    const msg = makeMessage({ thoughts: 'Deep analysis...' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    expect(lastFrame()!).toContain('💭');
    expect(lastFrame()!).toContain('Deep analysis...');
  });

  test('does not render thoughts block when empty', () => {
    const msg = makeMessage({ thoughts: '' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    expect(lastFrame()!).not.toContain('💭');
  });

  test('renders tool calls', () => {
    const msg = makeMessage({
      toolCalls: [
        { id: 'tc-1', title: 'Read file', status: 'completed' },
        { id: 'tc-2', title: 'Write file', status: 'started' },
      ],
    });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Read file');
    expect(frame).toContain('Write file');
    expect(frame).toContain('✓');
    expect(frame).toContain('⏳');
  });

  test('renders plan when entries exist', () => {
    const msg = makeMessage({
      plan: [
        { status: 'completed', content: 'Step 1' },
        { status: 'pending', content: 'Step 2' },
      ],
    });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Plan:');
    expect(frame).toContain('Step 1');
    expect(frame).toContain('Step 2');
  });

  test('does not render plan when entries are empty', () => {
    const msg = makeMessage({ plan: [] });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    expect(lastFrame()!).not.toContain('Plan:');
  });

  test('does not render text section when text is empty', () => {
    const msg = makeMessage({ text: '' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    // Should just have the header line with label and timestamp
    const frame = lastFrame()!;
    expect(frame).toContain('Agent');
    expect(frame).toContain('─');
  });

  test('renders separator line', () => {
    const msg = makeMessage({ text: 'test' });
    const { lastFrame } = render(<MessageBubble message={msg} />);
    expect(lastFrame()!).toContain('─'.repeat(32));
  });
});
