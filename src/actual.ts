import { mkdir } from 'node:fs/promises';

import * as api from '@actual-app/api';

import type { Config } from './config.ts';

function cents(amount: number): number {
  return Math.round(amount * 100);
}

async function findAccount(name: string) {
  const account = (await api.getAccounts()).find((item) => !item.closed && item.name === name);
  if (!account) {
    throw new Error(`No open Actual account named "${name}"`);
  }
  return account;
}

export async function writeBalance(config: Config, value: number, currency: string): Promise<void> {
  await mkdir(config.actualDataDir, { recursive: true });
  await api.init({
    dataDir: config.actualDataDir,
    serverURL: config.actualServerUrl,
    password: config.actualPassword,
  });

  try {
    await api.downloadBudget(
      config.actualSyncId,
      config.actualEncryptionPassword ? { password: config.actualEncryptionPassword } : undefined,
    );

    const account = await findAccount(config.actualAccountName);
    const current = await api.getAccountBalance(account.id);
    const adjustment = cents(value) - current;

    console.log(`${account.name}: ${(current / 100).toFixed(2)} → ${value.toFixed(2)} ${currency}`);

    if (adjustment === 0) {
      console.log('Already in sync');
      return;
    }

    if (config.dryRun) {
      console.log('DRY_RUN=true; not writing');
      return;
    }

    const imported = await api.importTransactions(account.id, [
      {
        account: account.id,
        date: Temporal.Now.plainDateISO().toString(),
        payee_name: 'Trading 212',
        amount: adjustment,
        cleared: true,
        notes: `Trading 212 ${value.toFixed(2)} ${currency}`,
      },
    ]);

    if (imported.errors?.length) {
      throw new Error(imported.errors.map((error) => error.message).join('; '));
    }

    await api.sync();
    console.log('Wrote adjustment to Actual');
  } finally {
    await api.shutdown();
  }
}
