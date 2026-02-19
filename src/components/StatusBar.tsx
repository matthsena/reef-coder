import { Box, Text } from 'ink';
import { ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';

interface StatusBarProps {
  engine: string;
  model: string;
  sessionId: string;
}

export function StatusBar({ engine, model, sessionId }: StatusBarProps) {
  const label = ENGINE_LABELS[engine] ?? engine;
  const color = ENGINE_COLORS[engine] ?? 'white';
  const shortSession = sessionId.slice(0, 8);

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold color={color}>{label}</Text>
      <Text dimColor> | </Text>
      <Text color="yellow">{model}</Text>
      <Text dimColor> | </Text>
      <Text color="cyan">{shortSession}</Text>
      <Text dimColor>  /switch to change engine</Text>
    </Box>
  );
}
