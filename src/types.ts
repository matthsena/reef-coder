export type Screen = 'engine-select' | 'connecting' | 'model-select' | 'chat';

export interface EngineConfig {
  executable: string;
  args: string[];
  model: string;
}

export const ENGINE_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  copilot: 'GitHub Copilot CLI',
  gemini: 'Gemini CLI',
  opencode: 'OpenCode',
  'qwen-code': 'Qwen Code',
};

export const ENGINES: Record<string, EngineConfig> = {
  'claude-code': {
    executable: 'claude-code-acp',
    args: [],
    model: 'opus',
  },
  codex: {
    executable: 'codex-acp',
    args: [],
    model: 'gpt-5.2-codex',
  },
  copilot: {
    executable: 'copilot',
    args: ['--acp', '--stdio'],
    model: 'gpt-5-mini',
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
