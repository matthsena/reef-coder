import { describe, expect, test } from 'bun:test';
import {
  ENGINES,
  ENGINE_LABELS,
  ENGINE_COLORS,
  type Screen,
  type ChatMessage,
  type ToolCallEntry,
  type PlanEntry,
} from './types.ts';

describe('ENGINES config', () => {
  const engineKeys = Object.keys(ENGINES);

  test('contains all expected engines', () => {
    expect(engineKeys).toContain('claude-code');
    expect(engineKeys).toContain('codex');
    expect(engineKeys).toContain('copilot');
    expect(engineKeys).toContain('opencode');
    expect(engineKeys).toContain('qwen-code');
    expect(engineKeys).toHaveLength(5);
  });

  test('every engine has executable, args array, and model', () => {
    for (const [, cfg] of Object.entries(ENGINES)) {
      expect(cfg.executable).toBeString();
      expect(cfg.executable.length).toBeGreaterThan(0);
      expect(Array.isArray(cfg.args)).toBe(true);
      expect(cfg.model).toBeString();
      expect(cfg.model.length).toBeGreaterThan(0);
    }
  });

  test('args are arrays of strings', () => {
    for (const cfg of Object.values(ENGINES)) {
      for (const arg of cfg.args) {
        expect(typeof arg).toBe('string');
      }
    }
  });
});

describe('ENGINE_LABELS', () => {
  test('has a label for every engine', () => {
    for (const key of Object.keys(ENGINES)) {
      expect(ENGINE_LABELS[key]).toBeString();
      expect(ENGINE_LABELS[key]!.length).toBeGreaterThan(0);
    }
  });

  test('labels are human-readable (no raw keys)', () => {
    for (const label of Object.values(ENGINE_LABELS)) {
      // Labels should have at least a capital letter
      expect(label).toMatch(/[A-Z]/);
    }
  });

  test('sorted labels produce expected order', () => {
    const sorted = Object.values(ENGINE_LABELS).sort((a, b) =>
      a.localeCompare(b),
    );
    expect(sorted).toEqual([
      'Claude Code',
      'Codex',
      'GitHub Copilot CLI',
      'OpenCode',
      'Qwen Code',
    ]);
  });
});

describe('ENGINE_COLORS', () => {
  test('has a color for every engine', () => {
    for (const key of Object.keys(ENGINES)) {
      expect(ENGINE_COLORS[key]).toBeString();
    }
  });

  test('all colors are valid hex', () => {
    for (const color of Object.values(ENGINE_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test('no duplicate colors', () => {
    const colors = Object.values(ENGINE_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

describe('Type structures', () => {
  test('Screen type allows valid values', () => {
    const validScreens: Screen[] = [
      'engine-select',
      'connecting',
      'model-select',
      'chat',
    ];
    expect(validScreens).toHaveLength(4);
  });

  test('ChatMessage shape', () => {
    const msg: ChatMessage = {
      role: 'agent',
      text: 'hello',
      thoughts: '',
      toolCalls: [],
      plan: [],
      timestamp: '12:00:00',
    };
    expect(msg.role).toBe('agent');
    expect(msg.text).toBe('hello');
  });

  test('ToolCallEntry shape', () => {
    const entry: ToolCallEntry = {
      id: 'tc-1',
      title: 'Read file',
      status: 'completed',
    };
    expect(entry.id).toBe('tc-1');
    expect(entry.status).toBe('completed');
  });

  test('PlanEntry shape', () => {
    const entry: PlanEntry = {
      status: 'in-progress',
      content: 'Step 1',
    };
    expect(entry.status).toBe('in-progress');
    expect(entry.content).toBe('Step 1');
  });
});
