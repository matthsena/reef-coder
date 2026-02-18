import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { ToolCallCard } from './ToolCallCard.tsx';

describe('ToolCallCard', () => {
  test('shows ⏳ icon for started status', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-1', title: 'Read file', status: 'started' }} />,
    );
    expect(lastFrame()!).toContain('⏳');
    expect(lastFrame()!).toContain('Read file');
  });

  test('shows ⏳ icon for running status', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-1', title: 'Execute', status: 'running' }} />,
    );
    expect(lastFrame()!).toContain('⏳');
  });

  test('shows ✓ icon for completed status', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-1', title: 'Done', status: 'completed' }} />,
    );
    expect(lastFrame()!).toContain('✓');
  });

  test('shows ✗ icon for error status', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-1', title: 'Failed', status: 'error' }} />,
    );
    expect(lastFrame()!).toContain('✗');
  });

  test('shows • icon for unknown status', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-1', title: 'Unknown', status: 'some-other' }} />,
    );
    expect(lastFrame()!).toContain('•');
  });

  test('displays the title', () => {
    const { lastFrame } = render(
      <ToolCallCard entry={{ id: 'tc-42', title: 'Write to disk', status: 'completed' }} />,
    );
    expect(lastFrame()!).toContain('Write to disk');
  });
});
