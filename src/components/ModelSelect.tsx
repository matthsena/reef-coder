import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';
import type { AvailableModel } from '../connection.ts';

interface ModelSelectProps {
  engine: string;
  availableModels: AvailableModel[];
  currentModelId: string | null;
  onSelect: (modelId: string) => void;
}

export function ModelSelect({
  engine,
  availableModels,
  currentModelId,
  onSelect,
}: ModelSelectProps) {
  const label = ENGINE_LABELS[engine] ?? engine;
  const color = ENGINE_COLORS[engine] ?? 'white';

  const items = availableModels.map((m) => ({
    label:
      m.modelId === currentModelId
        ? `${m.modelId} (current)`
        : m.modelId,
    value: m.modelId,
  }));

  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    } else if (key.return) {
      onSelect(items[selectedIndex]!.value);
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color={color}>{label}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Select model:</Text>
        <Box marginTop={1} flexDirection="column">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Box key={item.value}>
                <Text>{isSelected ? '❯ ' : '  '}</Text>
                <Text bold={isSelected} color={isSelected ? color : undefined}>
                  {item.label}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'  '}↑/↓ navigate {'  '} ⏎ select
        </Text>
      </Box>
    </Box>
  );
}
