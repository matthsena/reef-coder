import { Text } from 'ink';
import type { ToolCallEntry } from '../types.ts';

interface ToolCallCardProps {
  entry: ToolCallEntry;
}

const statusIcon: Record<string, string> = {
  started: '⏳',
  running: '⏳',
  completed: '✓',
  error: '✗',
};

export function ToolCallCard({ entry }: ToolCallCardProps) {
  const icon = statusIcon[entry.status] ?? '•';
  const color =
    entry.status === 'completed'
      ? 'green'
      : entry.status === 'error'
        ? 'red'
        : 'cyan';

  return (
    <Text>
      {'  '}
      <Text color={color}>{icon}</Text>{' '}
      <Text color="cyan">{entry.title}</Text>
    </Text>
  );
}
