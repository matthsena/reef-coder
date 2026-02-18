import { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';

interface ModelInputProps {
  engine: string;
  defaultModel: string;
  onSubmit: (modelId: string) => void;
}

export function ModelInput({ engine, defaultModel, onSubmit }: ModelInputProps) {
  const label = ENGINE_LABELS[engine] ?? engine;
  const color = ENGINE_COLORS[engine] ?? 'white';
  const [value, setValue] = useState(defaultModel);

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color={color}>{label}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Enter model name:</Text>
        <Box marginTop={1}>
          <Text color={color}>{'> '}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'  '}⏎ confirm
        </Text>
      </Box>
    </Box>
  );
}
