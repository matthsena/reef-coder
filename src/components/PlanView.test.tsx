import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { PlanView } from './PlanView.tsx';

describe('PlanView', () => {
  test('returns null for empty entries', () => {
    const { lastFrame } = render(<PlanView entries={[]} />);
    expect(lastFrame()).toBe('');
  });

  test('shows Plan: header', () => {
    const { lastFrame } = render(
      <PlanView entries={[{ status: 'pending', content: 'Step 1' }]} />,
    );
    expect(lastFrame()!).toContain('Plan:');
  });

  test('shows ✓ for completed entries', () => {
    const { lastFrame } = render(
      <PlanView entries={[{ status: 'completed', content: 'Done step' }]} />,
    );
    expect(lastFrame()!).toContain('✓');
    expect(lastFrame()!).toContain('Done step');
  });

  test('shows ◉ for in-progress entries', () => {
    const { lastFrame } = render(
      <PlanView entries={[{ status: 'in-progress', content: 'Working...' }]} />,
    );
    expect(lastFrame()!).toContain('◉');
    expect(lastFrame()!).toContain('Working...');
  });

  test('shows ○ for pending entries', () => {
    const { lastFrame } = render(
      <PlanView entries={[{ status: 'pending', content: 'Todo' }]} />,
    );
    expect(lastFrame()!).toContain('○');
    expect(lastFrame()!).toContain('Todo');
  });

  test('shows ○ for unknown status', () => {
    const { lastFrame } = render(
      <PlanView entries={[{ status: 'weird', content: 'Something' }]} />,
    );
    expect(lastFrame()!).toContain('○');
  });

  test('renders multiple entries', () => {
    const entries = [
      { status: 'completed', content: 'Step 1' },
      { status: 'in-progress', content: 'Step 2' },
      { status: 'pending', content: 'Step 3' },
    ];
    const { lastFrame } = render(<PlanView entries={entries} />);
    const frame = lastFrame()!;
    expect(frame).toContain('Step 1');
    expect(frame).toContain('Step 2');
    expect(frame).toContain('Step 3');
    expect(frame).toContain('✓');
    expect(frame).toContain('◉');
    expect(frame).toContain('○');
  });
});
