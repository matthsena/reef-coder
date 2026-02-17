import { useState, useCallback, useEffect } from 'react';
import { Box } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import { ENGINES } from '../types.ts';
import type { Screen } from '../types.ts';
import { SessionStore } from '../store.ts';
import { createConnection, setSessionModel } from '../connection.ts';
import type { AvailableModel } from '../connection.ts';
import { Header } from './Header.tsx';
import { EngineSelect } from './EngineSelect.tsx';
import { ModelSelect } from './ModelSelect.tsx';
import { Connecting } from './Connecting.tsx';
import { Chat } from './Chat.tsx';

interface AppProps {
  workdir: string;
}

export function App({ workdir }: AppProps) {
  const [screen, setScreen] = useState<Screen>('engine-select');
  const [engine, setEngine] = useState('');
  const [model, setModel] = useState('');
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [store] = useState(() => new SessionStore());
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [conn, setConn] = useState<{
    connection: acp.ClientSideConnection;
    sessionId: string;
    shutdown: () => Promise<void>;
  } | null>(null);

  const handleEngineSelect = useCallback((selected: string) => {
    setEngine(selected);
    setScreen('connecting');
  }, []);

  // Connect to engine after selection — fetch available models
  useEffect(() => {
    if (screen !== 'connecting' || !engine || conn) return;

    const onStatus = (msg: string) => {
      setStatusMessages((prev) => [...prev, msg]);
    };
    store.on('connection-status', onStatus);

    const engineCfg = ENGINES[engine]!;
    createConnection(engineCfg.executable, engineCfg.args, workdir, store)
      .then((result) => {
        setConn(result);
        setAvailableModels(result.availableModels);
        setCurrentModelId(result.currentModelId);
        if (result.availableModels.length > 0) {
          setScreen('model-select');
        } else {
          // No model list available — use engine default and go straight to chat
          setModel(engineCfg.model);
          setSessionModel(result.connection, result.sessionId, engineCfg.model, store)
            .then(() => setScreen('chat'))
            .catch((err: unknown) => {
              setStatusMessages((prev) => [
                ...prev,
                `Error setting model: ${err instanceof Error ? err.message : String(err)}`,
              ]);
            });
        }
      })
      .catch((err: unknown) => {
        setStatusMessages((prev) => [
          ...prev,
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        ]);
      });

    return () => {
      store.off('connection-status', onStatus);
    };
  }, [screen, engine, conn, workdir, store]);

  const handleModelSelect = useCallback(
    (selectedModel: string) => {
      if (!conn) return;
      setModel(selectedModel);
      setScreen('connecting');
      setStatusMessages((prev) => [...prev, `Setting model to ${selectedModel}...`]);
      setSessionModel(conn.connection, conn.sessionId, selectedModel, store)
        .then(() => setScreen('chat'))
        .catch((err: unknown) => {
          setStatusMessages((prev) => [
            ...prev,
            `Error setting model: ${err instanceof Error ? err.message : String(err)}`,
          ]);
        });
    },
    [conn, store],
  );

  const handleExit = useCallback(async () => {
    if (conn) await conn.shutdown();
  }, [conn]);

  return (
    <Box flexDirection="column">
      <Header
        engine={screen !== 'engine-select' ? engine : undefined}
        model={screen === 'chat' ? model : undefined}
      />

      {screen === 'engine-select' && (
        <EngineSelect onSelect={handleEngineSelect} />
      )}

      {screen === 'connecting' && (
        <Connecting engine={engine} statusMessages={statusMessages} />
      )}

      {screen === 'model-select' && (
        <ModelSelect
          engine={engine}
          availableModels={availableModels}
          currentModelId={currentModelId}
          onSelect={handleModelSelect}
        />
      )}

      {screen === 'chat' && conn && (
        <Chat
          engine={engine}
          model={model}
          sessionId={conn.sessionId}
          connection={conn.connection}
          store={store}
          onExit={handleExit}
        />
      )}
    </Box>
  );
}
