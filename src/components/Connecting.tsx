import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface ConnectingProps {
  engine: string;
  statusMessages: string[];
}

export function Connecting({ engine, statusMessages }: ConnectingProps) {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text>
          {' '}Connecting to <Text bold>{engine}</Text>...
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
