import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    global.sharedState = {};
});

afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});