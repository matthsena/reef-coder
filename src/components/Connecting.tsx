import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';

interface ConnectingProps {
  engine: string;
  statusMessages: string[];
}

export function Connecting({ engine, statusMessages }: ConnectingProps) {
  const label = ENGINE_LABELS[engine] ?? engine;
  const color = ENGINE_COLORS[engine] ?? 'white';

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box>
        <Text color={color}>
          <Spinner type="dots" />
        </Text>
        <Text>
          {' '}Connecting to <Text bold color={color}>{label}</Text>...
        </Text>
      </Box>
      {statusMessages.map((msg, i) => (
        <Text key={i} dimColor>
          {'  '}{msg}
        </Text>
      ))}
    </Box>
  );
}
