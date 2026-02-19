import { useState, useCallback, useEffect, useRef } from 'react';
import { Box } from 'ink';
import type * as acp from '@agentclientprotocol/sdk';
import { ENGINES } from '../types.ts';
import type { Screen, Session } from '../types.ts';
import { SessionStore } from '../store.ts';
import { createConnection, setSessionModel } from '../connection.ts';
import type { AvailableModel } from '../connection.ts';
import { createSession, saveSession } from '../session-manager.ts';
import { EngineSelect } from './EngineSelect.tsx';
import { SessionSelect } from './SessionSelect.tsx';
import { ModelSelect } from './ModelSelect.tsx';
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
  const [session, setSession] = useState<Session | null>(null);
  const [midChatModelSelect, setMidChatModelSelect] = useState(false);
  const [conn, setConn] = useState<{
    connection: acp.ClientSideConnection;
    sessionId: string;
    shutdown: () => Promise<void>;
  } | null>(null);
  const connectingRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const handleEngineSelect = useCallback((selected: string) => {
    setEngine(selected);
    setScreen('session-select');
  }, []);

  const handleNewSession = useCallback(() => {
    const engineCfg = ENGINES[engine];
    if (!engineCfg) {
      console.error(`Unknown engine: ${engine}`);
      return;
    }
    const newSession = createSession(workdir, engine, engineCfg.model);
    setSession(newSession);
    saveSession(workdir, newSession)
      .catch((err) => {
        console.error('[session] Failed to save new session:', err);
      })
      .finally(() => {
        setScreen('connecting');
      });
  }, [engine, workdir]);

  const handleExistingSession = useCallback((existingSession: Session) => {
    setSession(existingSession);
    setScreen('connecting');
  }, []);

  useEffect(() => {
    if (screen !== 'connecting' || !engine || conn || connectingRef.current) return;
    connectingRef.current = true;

    const onStatus = (msg: string) => {
      setStatusMessages((prev) => [...prev, msg]);
    };
    store.on('connection-status', onStatus);

    const engineCfg = ENGINES[engine];
    if (!engineCfg) {
      store.off('connection-status', onStatus);
      connectingRef.current = false;
      setStatusMessages((prev) => [...prev, `Error: Unknown engine ${engine}`]);
      setScreen('engine-select');
      return;
    }

    createConnection(engineCfg.executable, engineCfg.args, workdir, store)
      .then((result) => {
        store.off('connection-status', onStatus);
        setConn(result);
        setAvailableModels(result.availableModels);
        setCurrentModelId(result.currentModelId);
        if (result.availableModels.length > 0) {
          setScreen('model-select');
        } else {
          setModel(result.currentModelId ?? engineCfg.model);
          setScreen('chat');
        }
      })
      .catch((err: unknown) => {
        store.off('connection-status', onStatus);
        connectingRef.current = false;
        setStatusMessages((prev) => [...prev, `Error: ${formatError(err)}`]);
        setScreen('engine-select');
      });

    return () => {
      store.off('connection-status', onStatus);
    };
  }, [screen, engine, conn, workdir, store]);

  const handleModelChange = useCallback(
    async (modelId: string) => {
      if (!conn) return;
      try {
        await setSessionModel(conn.connection, conn.sessionId, modelId, store);
        setModel(modelId);
      } catch (err) {
        store.emit('connection-status', `Erro ao trocar modelo: ${formatError(err)}`);
      }
    },
    [conn, store],
  );

  const handleModelSelect = useCallback(
    async (selectedModel: string) => {
      if (!conn) return;

      if (midChatModelSelect) {
        setMidChatModelSelect(false);
        setScreen('chat');
        await handleModelChange(selectedModel);
        return;
      }

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
    [conn, store, midChatModelSelect, handleModelChange],
  );

  const handleSelectModel = useCallback(() => {
    setMidChatModelSelect(true);
    setScreen('model-select');
  }, []);

  const handleExit = useCallback(async () => {
    if (conn) await conn.shutdown();
  }, [conn]);

  const handleSwitchEngine = useCallback(async () => {
    if (conn) await conn.shutdown();
    setConn(null);
    connectingRef.current = false;
    setStatusMessages([]);
    setAvailableModels([]);
    setCurrentModelId(null);
    setScreen('engine-select');
  }, [conn]);

  const handleSessionUpdate = useCallback(
    (updatedSession: Session) => {
      setSession(updatedSession);
      saveSession(workdir, updatedSession).catch((err) => {
        console.error('[session] Failed to save session:', err);
      });
    },
    [workdir],
  );

  return (
    <Box flexDirection="column">
      {screen === 'engine-select' && (
        <EngineSelect onSelect={handleEngineSelect} />
      )}

      {screen === 'session-select' && (
        <SessionSelect
          workdir={workdir}
          engine={engine}
          onSelectNew={handleNewSession}
          onSelectExisting={handleExistingSession}
        />
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

      {screen === 'chat' && conn && session && (
        <Chat
          engine={engine}
          model={model}
          sessionId={conn.sessionId}
          connection={conn.connection}
          store={store}
          workdir={workdir}
          session={session}
          onExit={handleExit}
          onSwitchEngine={handleSwitchEngine}
          availableModels={availableModels}
          onModelChange={handleModelChange}
          onSelectModel={handleSelectModel}
          onSessionUpdate={handleSessionUpdate}
        />
      )}
    </Box>
  );
}
