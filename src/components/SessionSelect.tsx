import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Session } from '../types.ts';
import { listSessions } from '../session-manager.ts';
import { ENGINE_COLORS } from '../types.ts';

interface SessionSelectProps {
  workdir: string;
  engine: string;
  onSelectNew: () => void;
  onSelectExisting: (session: Session) => void;
}

interface SessionItem {
  type: 'new' | 'existing';
  session?: Session;
  label: string;
  sublabel?: string;
  color: string;
}

export function SessionSelect({
  workdir,
  engine,
  onSelectNew,
  onSelectExisting,
}: SessionSelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<SessionItem[]>([
    { type: 'new', label: 'Nova Sessao', color: '#22C55E' },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const sessions = await listSessions(workdir);
        const sessionItems: SessionItem[] = [
          { type: 'new', label: 'Nova Sessao', color: '#22C55E' },
        ];

        for (const session of sessions) {
          const lastMsg =
            session.messages.length > 0
              ? session.messages[session.messages.length - 1]
              : null;

          const preview = lastMsg
            ? lastMsg.text.slice(0, 40) + (lastMsg.text.length > 40 ? '...' : '')
            : 'Sessao vazia';

          const shortId = session.id.slice(0, 8);
          const updatedDate = new Date(session.updatedAt);
          const dateStr = updatedDate.toLocaleDateString('pt-BR');
          const timeStr = updatedDate.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          sessionItems.push({
            type: 'existing',
            session,
            label: `[${shortId}]`,
            sublabel: `${dateStr} ${timeStr} | ${session.messages.length} msgs | ${preview}`,
            color: ENGINE_COLORS[session.lastEngine] ?? '#FFFFFF',
          });
        }

        setItems(sessionItems);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    loadSessions();
  }, [workdir]);

  useInput((_input, key) => {
    if (loading) return;

    // On error, Enter creates new session
    if (error && key.return) {
      onSelectNew();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => (i > 0 ? i - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    } else if (key.return && items[selectedIndex]) {
      const item = items[selectedIndex];
      if (item.type === 'new') {
        onSelectNew();
      } else if (item.session) {
        onSelectExisting(item.session);
      }
    }
  });

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text>Carregando sessoes...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color="red">Erro ao carregar sessoes: {error}</Text>
        <Text dimColor>Pressione Enter para criar nova sessao</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold>Selecione a sessao ({engine}):</Text>
      <Box flexDirection="column" marginTop={1}>
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box key={item.session?.id ?? 'new'} flexDirection="column">
              <Box>
                <Text>{isSelected ? '> ' : '  '}</Text>
                <Text
                  bold={isSelected}
                  color={isSelected ? item.color : undefined}
                >
                  {item.label}
                </Text>
              </Box>
              {item.sublabel && (
                <Box marginLeft={4}>
                  <Text dimColor>{item.sublabel}</Text>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {'  '}Up/Down navegar {'  '} Enter selecionar
        </Text>
      </Box>
    </Box>
  );
}
