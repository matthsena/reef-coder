import { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface PromptInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function PromptInput({ disabled, onSubmit }: PromptInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    setValue('');
    onSubmit(trimmed);
  };

  return (
    <Box>
      <Text bold color={disabled ? 'gray' : 'green'}>
        You{'> '}
      </Text>
      {disabled ? (
        <Text dimColor>waiting for agent...</Text>
      ) : (
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
        />
      )}
    </Box>
  );
}
