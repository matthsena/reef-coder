export type Screen = 'engine-select' | 'connecting' | 'model-select' | 'chat';

export interface EngineConfig {
  executable: string;
  args: string[];
  model: string;
}

export const ENGINES: Record<string, EngineConfig> = {
  copilot: {
    executable: 'copilot',
    args: ['--acp', '--stdio'],
    model: 'gpt-5-mini',
  },
  'claude-code': {
    executable: 'claude-code-acp',
    args: [],
    model: 'opus',
  },
  gemini: {
    executable: 'gemini',
    args: ['--experimental-acp'],
    model: 'gemini-3-flash',
  },
  opencode: {
    executable: 'opencode',
    args: ['acp'],
    model: 'GLM-4.7',
  },
  'qwen-code': {
    executable: 'qwen',
    args: ['--acp'],
    model: 'corder-model',
  },
  codex: {
    executable: 'codex-acp',
    args: [],
    model: 'gpt-5.2-codex',
  },
};

export interface ToolCallEntry {
  id: string;
  title: string;
  status: string;
}

export interface PlanEntry {
  status: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  thoughts: string;
  toolCalls: ToolCallEntry[];
  plan: PlanEntry[];
  timestamp: string;
}
