import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ENGINES, ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';

interface EngineSelectProps {
  onSelect: (engine: string) => void;
}

const items = Object.keys(ENGINES)
  .map((key) => ({
    label: ENGINE_LABELS[key] ?? key,
    value: key,
    color: ENGINE_COLORS[key] ?? '#FFFFFF',
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function EngineSelect({ onSelect }: EngineSelectProps) {
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
      <Text bold>Select your engine:</Text>
      <Box flexDirection="column" marginTop={1}>
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={item.value}>
              <Text>{isSelected ? '❯ ' : '  '}</Text>
              <Text bold={isSelected} color={isSelected ? item.color : undefined}>
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'  '}↑/↓ navigate {'  '} ⏎ select
        </Text>
      </Box>
    </Box>
  );
}
