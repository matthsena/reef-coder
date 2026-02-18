import { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import { ENGINES } from '../types.ts';
import type { Screen } from '../types.ts';
import { SessionStore } from '../store.ts';
import { createConnection, setSessionModel } from '../connection.ts';
import type { AvailableModel } from '../connection.ts';
import { EngineSelect } from './EngineSelect.tsx';
import { ModelSelect } from './ModelSelect.tsx';
import { ModelInput } from './ModelInput.tsx';
import { Connecting } from './Connecting.tsx';
import { Chat } from './Chat.tsx';

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) return JSON.stringify(err);
  return String(err);
}

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
  // Track whether we've already initiated a connection attempt for the
  // current engine so the effect doesn't fire twice in React strict-mode.
  const connectingRef = useRef(false);
  // Track whether the component is still mounted to avoid stale state updates.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const handleEngineSelect = useCallback((selected: string) => {
    setEngine(selected);
    setScreen('connecting');
  }, []);

  // Connect to engine after selection — fetch available models
  useEffect(() => {
    if (screen !== 'connecting' || !engine || conn || connectingRef.current) return;
    connectingRef.current = true;

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
          // Engine provides model list — let the user pick
          setScreen('model-select');
        } else if (engineCfg.modelFlag) {
          // Engine doesn't list models but accepts a CLI model flag —
          // show a text input so the user can type a model name.
          setScreen('model-input');
        } else {
          // No model selection available — proceed with engine default
          setModel(result.currentModelId ?? engineCfg.model);
          setScreen('chat');
        }
      })
      .catch((err: unknown) => {
        connectingRef.current = false;
        setStatusMessages((prev) => [...prev, `Error: ${formatError(err)}`]);
      });

    return () => {
      store.off('connection-status', onStatus);
    };
  }, [screen, engine, conn, workdir, store]);

  // Handle ACP-based model selection (engines that return availableModels)
  const handleModelSelect = useCallback(
    (selectedModel: string) => {
      if (!conn) return;
      setModel(selectedModel);
      setScreen('connecting');
      setStatusMessages((prev) => [...prev, `Setting model to ${selectedModel}...`]);

      const onStatus = (msg: string) => {
        setStatusMessages((prev) => [...prev, msg]);
      };
      store.on('connection-status', onStatus);

      setSessionModel(conn.connection, conn.sessionId, selectedModel, store)
        .then(() => {
          store.off('connection-status', onStatus);
          if (mountedRef.current) setScreen('chat');
        })
        .catch((err: unknown) => {
          store.off('connection-status', onStatus);
          if (!mountedRef.current) return;
          setStatusMessages((prev) => [
            ...prev,
            `Error setting model: ${formatError(err)}`,
          ]);
          setScreen('model-select');
        });
    },
    [conn, store],
  );

  // Handle CLI-flag-based model selection (e.g. Gemini -m).
  // Tears down the existing connection and re-spawns with the model flag.
  const handleModelInput = useCallback(
    async (selectedModel: string) => {
      const engineCfg = ENGINES[engine]!;
      if (!engineCfg.modelFlag) return;

      // Shut down existing connection
      if (conn) {
        await conn.shutdown();
        setConn(null);
      }

      setModel(selectedModel);
      setScreen('connecting');
      // connectingRef stays true so the effect does not double-connect;
      // we handle the reconnection directly below.
      setStatusMessages([`Reconnecting with model ${selectedModel}...`]);

      const onStatus = (msg: string) => {
        setStatusMessages((prev) => [...prev, msg]);
      };
      store.on('connection-status', onStatus);

      try {
        const result = await createConnection(
          engineCfg.executable,
          engineCfg.args,
          workdir,
          store,
          { flag: engineCfg.modelFlag, value: selectedModel },
        );
        setConn(result);
        connectingRef.current = false;
        setScreen('chat');
      } catch (err: unknown) {
        connectingRef.current = false;
        setStatusMessages((prev) => [
          ...prev,
          `Error: ${formatError(err)}`,
        ]);
        setScreen('model-input');
      } finally {
        store.off('connection-status', onStatus);
      }
    },
    [engine, conn, workdir, store],
  );

  const handleExit = useCallback(async () => {
    if (conn) await conn.shutdown();
  }, [conn]);

  return (
    <Box flexDirection="column">
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

      {screen === 'model-input' && (
        <ModelInput
          engine={engine}
          defaultModel={ENGINES[engine]?.model ?? ''}
          onSubmit={handleModelInput}
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
