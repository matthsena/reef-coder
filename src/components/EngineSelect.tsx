import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ENGINES, ENGINE_LABELS } from '../types.ts';

interface EngineSelectProps {
  onSelect: (engine: string) => void;
}

const items = Object.keys(ENGINES)
  .map((key) => ({
    label: ENGINE_LABELS[key] ?? key,
    value: key,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function EngineSelect({ onSelect }: EngineSelectProps) {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Select your engine:</Text>
      <Box marginTop={1}>
        <SelectInput
          items={items}
          onSelect={(item) => onSelect(item.value)}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'  '}↑/↓ navigate {'  '} ⏎ select
        </Text>
      </Box>
    </Box>
  );
}
