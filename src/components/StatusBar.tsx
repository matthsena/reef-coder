import { Box, Text } from 'ink';

interface StatusBarProps {
  engine: string;
  model: string;
  sessionId: string;
}

export function StatusBar({ engine, model, sessionId }: StatusBarProps) {
  const shortSession = sessionId.slice(0, 8);
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text color="cyan">{engine}</Text>
      <Text dimColor> │ </Text>
      <Text color="yellow">{model}</Text>
      <Text dimColor> │ </Text>
      <Text dimColor>session: {shortSession}</Text>
    </Box>
  );
}
