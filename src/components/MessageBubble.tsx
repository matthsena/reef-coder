import { Box, Text } from 'ink';
import type { ChatMessage } from '../types.ts';
import { ToolCallCard } from './ToolCallCard.tsx';
import { ThoughtBlock } from './ThoughtBlock.tsx';
import { PlanView } from './PlanView.tsx';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const label = isUser ? 'You' : 'Agent';
  const labelColor = isUser ? 'green' : 'magenta';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={labelColor}>
          {label}
        </Text>
        <Text dimColor>
          {' '}{'─'.repeat(32)} {message.timestamp}
        </Text>
      </Box>
      {message.thoughts ? <ThoughtBlock text={message.thoughts} /> : null}
      {message.toolCalls.map((tc) => (
        <ToolCallCard key={tc.id} entry={tc} />
      ))}
      {message.plan.length > 0 ? <PlanView entries={message.plan} /> : null}
      {message.text ? (
        <Box paddingLeft={2}>
          <Text>{message.text}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
