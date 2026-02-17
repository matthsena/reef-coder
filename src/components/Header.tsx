import { Box, Text } from 'ink';

interface HeaderProps {
  engine?: string;
  model?: string;
}

export function Header({ engine, model }: HeaderProps) {
  const subtitle = engine
    ? `${engine}${model ? ` / ${model}` : ''}`
    : 'Multi-Engine AI Terminal';

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      paddingX={2}
      paddingY={1}
      borderStyle="round"
      borderColor="cyan"
    >
      <Text bold color="cyan">
        AGENT SWARM
      </Text>
      <Text dimColor>{subtitle}</Text>
    </Box>
  );
}
