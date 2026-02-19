import { mkdir, readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Session, ChatMessage } from './types.ts';

const DATA_DIR = '.data';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SESSIONS_TO_LOAD = 50;
const CONTEXT_MESSAGE_LIMIT = 20;

function isValidSession(obj: unknown): obj is Session {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s['id'] === 'string' &&
    typeof s['name'] === 'string' &&
    typeof s['workdir'] === 'string' &&
    typeof s['createdAt'] === 'string' &&
    typeof s['updatedAt'] === 'string' &&
    typeof s['lastEngine'] === 'string' &&
    typeof s['lastModel'] === 'string' &&
    Array.isArray(s['messages'])
  );
}

export async function ensureDataDir(workdir: string): Promise<string> {
  const dataDir = join(workdir, DATA_DIR);
  await mkdir(dataDir, { recursive: true });
  return dataDir;
}

export async function listSessions(workdir: string): Promise<Session[]> {
  const dataDir = join(workdir, DATA_DIR);

  try {
    const files = await readdir(dataDir);
    const sessionFiles = files
      .filter((f) => f.endsWith('.json') && f !== 'sessions.json')
      .slice(0, MAX_SESSIONS_TO_LOAD);

    const results = await Promise.all(
      sessionFiles.map(async (file) => {
        try {
          const expectedId = file.replace(/\.json$/, '');
          if (!UUID_REGEX.test(expectedId)) return null;

          const content = await readFile(join(dataDir, file), 'utf-8');
          const parsed: unknown = JSON.parse(content);

          if (!isValidSession(parsed)) return null;
          if (parsed.id !== expectedId) return null;

          return parsed;
        } catch {
          return null;
        }
      }),
    );

    return results
      .filter((s): s is Session => s !== null)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  } catch {
    // Directory doesn't exist yet
    return [];
  }
}

export async function loadSession(
  workdir: string,
  sessionId: string,
): Promise<Session | null> {
  // Validate UUID format to prevent path traversal
  if (!UUID_REGEX.test(sessionId)) {
    return null;
  }

  const dataDir = resolve(workdir, DATA_DIR);
  const filePath = resolve(dataDir, `${sessionId}.json`);

  // Ensure resolved path is within dataDir
  if (!filePath.startsWith(dataDir + '/')) {
    return null;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(content);

    if (!isValidSession(parsed)) return null;
    if (parsed.id !== sessionId) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(
  workdir: string,
  session: Session,
): Promise<void> {
  // Validate UUID format
  if (!UUID_REGEX.test(session.id)) {
    throw new Error('Invalid session ID format');
  }

  const dataDir = await ensureDataDir(workdir);
  const filePath = join(dataDir, `${session.id}.json`);
  const tmpPath = filePath + '.tmp';

  // Create immutable copy with updated timestamp
  const toWrite: Session = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  // Atomic write: write to temp file then rename
  await writeFile(tmpPath, JSON.stringify(toWrite, null, 2), 'utf-8');
  await rename(tmpPath, filePath);
}

export function createSession(
  workdir: string,
  engine: string,
  model: string,
): Session {
  const now = new Date();
  const id = randomUUID();

  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('pt-BR');

  return {
    id,
    name: `${dateStr} ${timeStr} - ${engine}`,
    workdir,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastEngine: engine,
    lastModel: model,
    messages: [],
  };
}

export function formatSessionContext(session: Session): string {
  if (session.messages.length === 0) {
    return '';
  }

  // Limit context to avoid exceeding model context windows
  const recentMessages = session.messages.slice(-CONTEXT_MESSAGE_LIMIT);

  const lines: string[] = [
    `[Previous session context - Engine: ${session.lastEngine}]`,
    '',
  ];

  for (const msg of recentMessages) {
    const role = msg.role === 'user' ? 'User' : 'Agent';
    lines.push(`${role} (${msg.timestamp}): ${msg.text}`);

    if (msg.toolCalls.length > 0) {
      const tools = msg.toolCalls.map((tc) => tc.title).join(', ');
      lines.push(`[tools used: ${tools}]`);
    }

    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('[New user message below]');
  lines.push('');

  return lines.join('\n');
}

export function updateSessionMessages(
  session: Session,
  messages: ChatMessage[],
  engine: string,
  model: string,
): Session {
  return {
    ...session,
    messages,
    lastEngine: engine,
    lastModel: model,
    updatedAt: new Date().toISOString(),
  };
}
