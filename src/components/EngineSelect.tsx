import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { ENGINES } from '../types.ts';

interface EngineSelectProps {
  onSelect: (engine: string) => void;
}

const items = Object.entries(ENGINES).map(([key, cfg]) => ({
  label: `${key.padEnd(16)} ${cfg.model}`,
  value: key,
}));

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
