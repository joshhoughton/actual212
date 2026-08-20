import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.ts';

function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    T212_API_KEY: 'key',
    T212_API_SECRET: 'secret',
    ACTUAL_SERVER_URL: 'http://actual:5006',
    ACTUAL_PASSWORD: 'secret',
    ACTUAL_SYNC_ID: 'sync-id',
    ACTUAL_ACCOUNT_NAME: 'Trading 212',
    ...overrides,
  };
}

describe('loadConfig', () => {
  it('loads env and encodes Trading 212 Basic auth', () => {
    const config = loadConfig(env());
    expect(config.actualAccountName).toBe('Trading 212');
    expect(config.t212Token).toBe(`Basic ${Buffer.from('key:secret').toString('base64')}`);
    expect(config.dryRun).toBe(false);
    expect(config.cronSchedule).toBeUndefined();
  });

  it('reads an optional cron schedule', () => {
    expect(loadConfig(env({ CRON_SCHEDULE: '0 6 * * *' })).cronSchedule).toBe('0 6 * * *');
  });

  it('requires an Actual account name', () => {
    expect(() => loadConfig(env({ ACTUAL_ACCOUNT_NAME: undefined }))).toThrow(
      /ACTUAL_ACCOUNT_NAME/,
    );
  });

  it('requires a Trading 212 key and secret', () => {
    expect(() => loadConfig(env({ T212_API_KEY: undefined }))).toThrow(/T212_API_KEY/);
    expect(() => loadConfig(env({ T212_API_SECRET: undefined }))).toThrow(/T212_API_SECRET/);
  });
});
