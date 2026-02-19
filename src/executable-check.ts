import { ENGINES } from './types.ts';

export interface EngineAvailability {
  engine: string;
  executable: string;
  available: boolean;
}

export async function checkAvailableEngines(): Promise<EngineAvailability[]> {
  return Object.entries(ENGINES).map(([engine, config]) => ({
    engine,
    executable: config.executable,
    available: Bun.which(config.executable) !== null,
  }));
}

export async function getAvailableEngines(): Promise<string[]> {
  const results = await checkAvailableEngines();
  return results.filter((r) => r.available).map((r) => r.engine);
}
