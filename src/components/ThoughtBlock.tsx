import { Box, Text } from 'ink';

interface ThoughtBlockProps {
  text: string;
}

export function ThoughtBlock({ text }: ThoughtBlockProps) {
  if (!text) return null;
  return (
    <Box paddingLeft={2}>
      <Text dimColor>💭 {text}</Text>
    </Box>
  );
}
