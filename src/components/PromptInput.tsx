import { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { useVoiceInput } from '../hooks/useVoiceInput.ts';

interface PromptInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function PromptInput({ disabled, onSubmit }: PromptInputProps) {
  const [value, setValue] = useState('');

  const handleTranscription = useCallback((text: string) => {
    setValue((prev) => (prev ? prev + ' ' + text : text));
  }, []);

  const { voiceState, error, toggleRecording } = useVoiceInput(handleTranscription);

  useInput(
    (_input, key) => {
      if (key.tab) {
        toggleRecording();
      }
    },
    { isActive: !disabled },
  );

  const handleSubmit = (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return;
    setValue('');
    onSubmit(trimmed);
  };

  return (
    <Box flexDirection="column">
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
              onChange={setValue}
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
      {!disabled && voiceState === 'idle' && !error && (
        <Text dimColor>Tab: voice input</Text>
      )}
    </Box>
  );
}
