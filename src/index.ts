import { Cron } from 'croner';

import { loadConfig, type Config } from './config.ts';
import { ensureDataDir, writeBalance } from './actual.ts';
import { fetchAccountSummary } from './trading212.ts';

async function sync(config: Config): Promise<void> {
  const summary = await fetchAccountSummary(config.t212BaseUrl, config.t212Token);

  console.log(`Trading 212 ${summary.id}: ${summary.totalValue.toFixed(2)} ${summary.currency}`);

  await writeBalance(config, summary.totalValue, summary.currency);
}

function logError(error: unknown): void {
  console.error(error instanceof Error ? error.message : error);
}

function createCronSchedule(schedule: string, run: () => Promise<void>): Cron {
  const job = new Cron(
    schedule,
    {
      protect: true,
      catch: logError,
      timezone: process.env.TZ?.trim() || undefined,
    },
    run,
  );

  const next = job.nextRun();
  if (!next) {
    throw new Error(`CRON_SCHEDULE=${schedule} will never run`);
  }

  console.log(`CRON_SCHEDULE=${schedule}; next ${next.toISOString()}`);

  const stop = (): void => {
    job.stop();
    process.exit(0);
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);

  return job;
}

async function main(): Promise<void> {
  const config = loadConfig();
  await ensureDataDir(config.actualDataDir);

  if (!config.cronSchedule) {
    await sync(config);
    return;
  }

  createCronSchedule(config.cronSchedule, () => sync(config));
}

try {
  await main();
} catch (error) {
  logError(error);
  process.exitCode = 1;
}
