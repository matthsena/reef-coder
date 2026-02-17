import { EventEmitter } from 'node:events';
import type { ToolCallEntry, PlanEntry } from './types.ts';

export interface SessionStoreEvents {
  'agent-message-chunk': [text: string];
  'agent-thought-chunk': [text: string];
  'tool-call': [entry: ToolCallEntry];
  'tool-call-update': [id: string, status: string];
  'plan': [entries: PlanEntry[]];
  'permission': [message: string];
  'connection-status': [message: string];
  'turn-end': [stopReason: string];
}

export class SessionStore extends EventEmitter<SessionStoreEvents> {}
