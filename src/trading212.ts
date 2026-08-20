export type AccountSummary = {
  id: number;
  currency: string;
  totalValue: number;
};

export async function fetchAccountSummary(
  baseUrl: string,
  authorization: string,
): Promise<AccountSummary> {
  const response = await fetch(`${baseUrl}/api/v0/equity/account/summary`, {
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    throw new Error('Trading 212 rejected the API key (401)');
  }
  if (response.status === 403) {
    throw new Error('Trading 212 API key is missing the account scope (403)');
  }
  if (!response.ok) {
    throw new Error(`Trading 212 request failed (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!isAccountSummary(data)) {
    throw new Error('Trading 212 returned an unexpected response');
  }

  return data;
}

function isAccountSummary(data: unknown): data is AccountSummary {
  return (
    typeof data === 'object' &&
    data !== null &&
    'totalValue' in data &&
    typeof data.totalValue === 'number'
  );
}
