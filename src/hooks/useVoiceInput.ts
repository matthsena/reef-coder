import { useState, useRef, useCallback, useEffect } from 'react';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  type RecordingSession,
} from '../voice-input.ts';

export type VoiceState = 'idle' | 'recording' | 'transcribing';

interface UseVoiceInputResult {
  voiceState: VoiceState;
  error: string | null;
  toggleRecording: () => void;
}

export function useVoiceInput(
  onTranscription: (text: string) => void,
): UseVoiceInputResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<RecordingSession | null>(null);

  const toggleRecording = useCallback(() => {
    if (voiceState === 'transcribing') return;

    setError(null);

    if (voiceState === 'idle') {
      try {
        const session = startRecording();
        sessionRef.current = session;
        setVoiceState('recording');
      } catch (err: any) {
        setError(err.message ?? 'Failed to start recording');
      }
    } else if (voiceState === 'recording') {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      setVoiceState('transcribing');

      (async () => {
        try {
          const filePath = await stopRecording(session);
          const text = await transcribeAudio(filePath);
          if (text.trim()) {
            onTranscription(text.trim());
          }
        } catch (err: any) {
          setError(err.message ?? 'Transcription failed');
        } finally {
          setVoiceState('idle');
        }
      })();
    }
  }, [voiceState, onTranscription]);

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session) {
        session.process.kill('SIGINT');
        sessionRef.current = null;
      }
    };
  }, []);

  return { voiceState, error, toggleRecording };
}
