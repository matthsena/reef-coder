import { spawn, type ChildProcess } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';

export interface RecordingSession {
  filePath: string;
  process: ChildProcess;
  exitPromise: Promise<void>;
}

export function startRecording(): RecordingSession {
  const filePath = join(tmpdir(), `voice-${Date.now()}.wav`);
  const proc = spawn('arecord', ['-f', 'cd', '-t', 'wav', '-q', filePath], {
    stdio: 'ignore',
  });

  const { promise: exitPromise, resolve } = Promise.withResolvers<void>();

  proc.on('error', () => resolve());
  proc.on('exit', () => resolve());

  return { filePath, process: proc, exitPromise };
}

export async function stopRecording(session: RecordingSession): Promise<string> {
  session.process.kill('SIGINT');
  await session.exitPromise;
  return session.filePath;
}

export async function transcribeAudio(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  try {
    const file = Bun.file(filePath);
    const blob = await file.arrayBuffer();

    const form = new FormData();
    form.append('file', new Blob([blob], { type: 'audio/wav' }), 'audio.wav');
    form.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Whisper API ${res.status}: ${body}`);
    }

    const data = (await res.json()) as { text: string };
    return data.text;
  } finally {
    await unlink(filePath).catch(() => {});
  }
}
