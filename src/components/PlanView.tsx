import { Box, Text } from 'ink';
import type { PlanEntry } from '../types.ts';

interface PlanViewProps {
  entries: PlanEntry[];
}

const statusIcon: Record<string, string> = {
  completed: '✓',
  'in-progress': '◉',
  pending: '○',
};

export function PlanView({ entries }: PlanViewProps) {
  if (entries.length === 0) return null;
  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text bold color="yellow">
        Plan:
      </Text>
      {entries.map((entry, i) => {
        const icon = statusIcon[entry.status] ?? '○';
        const color =
          entry.status === 'completed'
            ? 'green'
            : entry.status === 'in-progress'
              ? 'yellow'
              : 'white';
        return (
          <Text key={`${i}:${entry.status}:${entry.content}`}>
            {'  '}
            <Text color={color}>{icon}</Text> {entry.content}
          </Text>
        );
      })}
    </Box>
  );
}
