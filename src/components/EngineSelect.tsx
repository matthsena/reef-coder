import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { ENGINES, ENGINE_LABELS, ENGINE_COLORS } from '../types.ts';
import { checkAvailableEngines } from '../executable-check.ts';

interface EngineSelectProps {
  onSelect: (engine: string) => void;
}

interface EngineItem {
  label: string;
  value: string;
  color: string;
  available: boolean;
  executable: string;
}

export function EngineSelect({ onSelect }: EngineSelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EngineItem[]>([]);

  useEffect(() => {
    checkAvailableEngines().then((results) => {
      const engineItems = Object.keys(ENGINES)
        .map((key) => {
          const availability = results.find((r) => r.engine === key);
          return {
            label: ENGINE_LABELS[key] ?? key,
            value: key,
            color: ENGINE_COLORS[key] ?? '#FFFFFF',
            available: availability?.available ?? false,
            executable: availability?.executable ?? ENGINES[key]!.executable,
          };
        })
        .sort((a, b) => {
          // Available engines first, then alphabetically
          if (a.available !== b.available) {
            return a.available ? -1 : 1;
          }
          return a.label.localeCompare(b.label);
        });

      setItems(engineItems);
      setLoading(false);
    });
  }, []);

  const availableItems = items.filter((item) => item.available);

  useInput(
    (_input, key) => {
      if (loading || availableItems.length === 0) return;

      if (key.upArrow) {
        setSelectedIndex((i) => (i > 0 ? i - 1 : availableItems.length - 1));
      } else if (key.downArrow) {
        setSelectedIndex((i) => (i < availableItems.length - 1 ? i + 1 : 0));
      } else if (key.return && availableItems[selectedIndex]) {
        onSelect(availableItems[selectedIndex].value);
      }
    },
    { isActive: !loading },
  );

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text>
          <Spinner type="dots" /> Checking available engines...
        </Text>
      </Box>
    );
  }

  if (availableItems.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text bold color="red">No engines available</Text>
        <Box marginTop={1} flexDirection="column">
          <Text>Install at least one of the following:</Text>
          {items.map((item) => (
            <Box key={item.value} marginLeft={2}>
              <Text dimColor>• </Text>
              <Text>{item.label}</Text>
              <Text dimColor> ({item.executable})</Text>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Select your engine:</Text>
      <Box flexDirection="column" marginTop={1}>
        {availableItems.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={item.value}>
              <Text>{isSelected ? '> ' : '  '}</Text>
              <Text bold={isSelected} color={isSelected ? item.color : undefined}>
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>

      {items.some((item) => !item.available) && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>Not installed:</Text>
          {items
            .filter((item) => !item.available)
            .map((item) => (
              <Box key={item.value} marginLeft={2}>
                <Text dimColor>• {item.label} ({item.executable})</Text>
              </Box>
            ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          {'  '}Up/Down navigate {'  '} Enter select
        </Text>
      </Box>
    </Box>
  );
}
