export type Config = {
  t212Token: string;
  t212BaseUrl: string;
  actualServerUrl: string;
  actualPassword: string;
  actualSyncId: string;
  actualEncryptionPassword?: string;
  actualAccountName: string;
  actualDataDir: string;
  dryRun: boolean;
  cronSchedule?: string;
};

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function truthy(value: string | undefined): boolean {
  return ['1', 'true', 'yes', 'on'].includes(value?.trim().toLowerCase() ?? '');
}

function t212Authorization(key: string, secret: string): string {
  return `Basic ${Buffer.from(`${key}:${secret}`, 'utf8').toString('base64')}`;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    t212Token: t212Authorization(
      required('T212_API_KEY', env.T212_API_KEY),
      required('T212_API_SECRET', env.T212_API_SECRET),
    ),
    t212BaseUrl: (optional(env.T212_BASE_URL) ?? 'https://live.trading212.com').replace(/\/+$/, ''),
    actualServerUrl: required('ACTUAL_SERVER_URL', env.ACTUAL_SERVER_URL).replace(/\/+$/, ''),
    actualPassword: required('ACTUAL_PASSWORD', env.ACTUAL_PASSWORD),
    actualSyncId: required('ACTUAL_SYNC_ID', env.ACTUAL_SYNC_ID),
    actualEncryptionPassword: optional(env.ACTUAL_ENCRYPTION_PASSWORD),
    actualAccountName: required('ACTUAL_ACCOUNT_NAME', env.ACTUAL_ACCOUNT_NAME),
    actualDataDir: optional(env.ACTUAL_DATA_DIR) ?? './data',
    dryRun: truthy(env.DRY_RUN),
    cronSchedule: optional(env.CRON_SCHEDULE),
  };
}
