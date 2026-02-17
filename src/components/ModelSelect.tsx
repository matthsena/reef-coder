import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
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
  const items = availableModels.map((m) => ({
    label:
      m.modelId === currentModelId
        ? `${m.modelId} (current)`
        : m.modelId,
    value: m.modelId,
  }));

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text>
        Engine: <Text bold color="cyan">{engine}</Text>
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Select model:</Text>
        <Box marginTop={1}>
          <SelectInput
            items={items}
            onSelect={(item) => onSelect(item.value)}
          />
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
