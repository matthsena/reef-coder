import { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { useVoiceInput } from '../hooks/useVoiceInput.ts';
import { getMatchingCommands, COMMANDS } from '../commands.ts';

interface PromptInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function PromptInput({ disabled, onSubmit }: PromptInputProps) {
  const [value, setValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTranscription = useCallback((text: string) => {
    setValue((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  const { voiceState, error, toggleRecording } = useVoiceInput(handleTranscription);

  const matchingCommands = useMemo(() => {
    if (!value.startsWith('/')) return [];
    if (value === '/') return COMMANDS;
    return getMatchingCommands(value);
  }, [value]);

  const showCommandPreview = !disabled && value.startsWith('/') && matchingCommands.length > 0;

  useInput(
    (input, key) => {
      if (key.tab && !showCommandPreview) {
        toggleRecording();
        return;
      }

      if (showCommandPreview) {
        if (key.upArrow) {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : matchingCommands.length - 1));
          return;
        }
        if (key.downArrow) {
          setSelectedIndex((prev) => (prev < matchingCommands.length - 1 ? prev + 1 : 0));
          return;
        }
        if (key.tab) {
          const selected = matchingCommands[selectedIndex];
          if (selected) {
            setValue(selected.name);
            setSelectedIndex(0);
          }
          return;
        }
      }
    },
    { isActive: !disabled },
  );

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setSelectedIndex(0);
  }, []);

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;

    if (showCommandPreview && matchingCommands[selectedIndex]) {
      const selectedCommand = matchingCommands[selectedIndex].name;
      setValue('');
      setSelectedIndex(0);
      onSubmit(selectedCommand);
      return;
    }

    setValue('');
    setSelectedIndex(0);
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column">
      {showCommandPreview && (
        <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="gray" paddingX={1}>
          {matchingCommands.map((cmd, index) => {
            const isSelected = index === selectedIndex;
            const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
            return (
              <Box key={cmd.name}>
                <Text
                  color={isSelected ? 'cyan' : undefined}
                  bold={isSelected}
                  inverse={isSelected}
                >
                  {' '}{cmd.name}{aliases}
                </Text>
                <Text dimColor> - {cmd.description}</Text>
              </Box>
            );
          })}
          <Box marginTop={1}>
            <Text dimColor italic>Tab: selecionar | Enter: executar | Setas: navegar</Text>
          </Box>
        </Box>
      )}

      <Box>
        <Text bold color={disabled ? 'gray' : 'green'}>
          You{'> '}
        </Text>
        {disabled ? (
          <Text dimColor>waiting for agent...</Text>
        ) : (
          <>
            <TextInput
              value={value}
              onChange={handleChange}
              onSubmit={handleSubmit}
            />
            {voiceState === 'recording' && (
              <Box marginLeft={1}>
                <Text color="red">
                  <Spinner type="dots" />
                </Text>
                <Text color="red" bold>
                  {' '}
                  REC
                </Text>
              </Box>
            )}
            {voiceState === 'transcribing' && (
              <Box marginLeft={1}>
                <Text color="yellow">
                  <Spinner type="dots" />
                </Text>
                <Text color="yellow"> transcribing...</Text>
              </Box>
            )}
          </>
        )}
      </Box>
      {error && (
        <Text color="red">[voice error: {error}]</Text>
      )}
      {!disabled && voiceState === 'idle' && !error && !showCommandPreview && (
        <Text dimColor>Tab: voice input | /: comandos</Text>
      )}
    </Box>
  );
}
