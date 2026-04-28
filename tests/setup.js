import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
    // Limpa estado global antes de cada teste
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    global.sharedState = {};
});

afterEach(() => {
    // Limpa mocks após cada teste
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

