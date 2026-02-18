export type Screen = 'engine-select' | 'connecting' | 'model-select' | 'model-input' | 'chat';

export interface EngineConfig {
  executable: string;
  args: string[];
  model: string;
  /** CLI flag for model selection (e.g. '-m'). When set, the model is passed
   *  as a spawn arg instead of via the ACP session/set_model method. */
  modelFlag?: string;
  /** Predefined model list for the selection screen when the engine
   *  doesn't provide models via ACP but supports a model CLI flag. */
  predefinedModels?: string[];
}

export const ENGINE_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  copilot: 'GitHub Copilot CLI',
  gemini: 'Gemini CLI',
  opencode: 'OpenCode',
  'qwen-code': 'Qwen Code',
};

export const ENGINE_COLORS: Record<string, string> = {
  'claude-code': '#E07A5F',
  codex: '#10A37F',
  copilot: '#79C0FF',
  gemini: '#4285F4',
  opencode: '#22C55E',
  'qwen-code': '#7C3AED',
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
    model: 'gpt-5.3-codex',
  },
  copilot: {
    executable: 'copilot',
    args: ['--acp'],
    model: 'claude-sonnet-4.5',
  },
  gemini: {
    executable: 'gemini',
    args: ['--experimental-acp'],
    model: 'gemini-2.5-flash',
    modelFlag: '-m',
    predefinedModels: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
    ],
  },
  opencode: {
    executable: 'opencode',
    args: ['acp'],
    model: 'opencode/big-pickle',
  },
  'qwen-code': {
    executable: 'qwen',
    args: ['--acp'],
    model: 'coder-model(qwen-oauth)',
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
