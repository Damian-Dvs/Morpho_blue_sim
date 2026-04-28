import type { Market } from '../types';
import { wadToDecimal } from '../utils/yieldMath';

const QUERY = `
query GetUSDCMarkets {
  markets(
    first: 12,
    where: { loanAssetSymbol_in: ["USDC"] },
    orderBy: SupplyApy,
    orderDirection: Desc
  ) {
    items {
      uniqueKey
      lltv
      state {
        supplyApy
        borrowApy
        netSupplyApy
        netBorrowApy
        totalSupplyUsd
        totalBorrowUsd
      }
      loanAsset { symbol }
      collateralAsset { symbol }
    }
  }
}
`;

const parseMarket = (m: any): Market => {
  const lltv = wadToDecimal(m.lltv);
  return {
    uniqueKey: m.uniqueKey,
    lltv,
    maxLeverage: 1 / Math.max(0.0001, 1 - lltv),
    supplyApy: wadToDecimal(m.state.supplyApy),
    borrowApy: wadToDecimal(m.state.borrowApy),
    netSupplyApy: wadToDecimal(m.state.netSupplyApy),
    netBorrowApy: wadToDecimal(m.state.netBorrowApy),
    totalSupplyUsd: Number(m.state.totalSupplyUsd ?? 0),
    totalBorrowUsd: Number(m.state.totalBorrowUsd ?? 0),
    loanAssetSymbol: m.loanAsset.symbol,
    collateralAssetSymbol: m.collateralAsset.symbol,
  };
};

export const fallbackMarkets: Market[] = [
  { uniqueKey: 'usdc-weth', lltv: 0.86, maxLeverage: 7.14, supplyApy: 0.072, borrowApy: 0.081, netSupplyApy: 0.068, netBorrowApy: 0.085, totalSupplyUsd: 120_000_000, totalBorrowUsd: 80_000_000, loanAssetSymbol: 'USDC', collateralAssetSymbol: 'WETH' },
  { uniqueKey: 'usdc-wbtc', lltv: 0.86, maxLeverage: 7.14, supplyApy: 0.069, borrowApy: 0.078, netSupplyApy: 0.065, netBorrowApy: 0.082, totalSupplyUsd: 95_000_000, totalBorrowUsd: 62_000_000, loanAssetSymbol: 'USDC', collateralAssetSymbol: 'WBTC' },
  { uniqueKey: 'usdc-cbbtc', lltv: 0.77, maxLeverage: 4.35, supplyApy: 0.061, borrowApy: 0.073, netSupplyApy: 0.058, netBorrowApy: 0.076, totalSupplyUsd: 54_000_000, totalBorrowUsd: 31_000_000, loanAssetSymbol: 'USDC', collateralAssetSymbol: 'cbBTC' },
  { uniqueKey: 'usdc-wsteth', lltv: 0.86, maxLeverage: 7.14, supplyApy: 0.055, borrowApy: 0.063, netSupplyApy: 0.052, netBorrowApy: 0.067, totalSupplyUsd: 47_000_000, totalBorrowUsd: 22_000_000, loanAssetSymbol: 'USDC', collateralAssetSymbol: 'wstETH' },
  { uniqueKey: 'usdc-reth', lltv: 0.77, maxLeverage: 4.35, supplyApy: 0.049, borrowApy: 0.059, netSupplyApy: 0.046, netBorrowApy: 0.062, totalSupplyUsd: 28_000_000, totalBorrowUsd: 14_000_000, loanAssetSymbol: 'USDC', collateralAssetSymbol: 'rETH' },
];

const ENDPOINTS = ['/api/morpho', 'https://blue-api.morpho.org/graphql'];

export async function fetchMorphoMarkets(): Promise<Market[]> {
  let lastError = 'Unable to fetch Morpho markets';

  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: QUERY }),
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status} from ${endpoint}`;
        continue;
      }

      const json = await res.json();

      if (Array.isArray(json?.errors) && json.errors.length > 0) {
        const first = json.errors[0]?.message ?? 'GraphQL error';
        lastError = `${endpoint}: ${first}`;
        continue;
      }

      const items = json?.data?.markets?.items;
      if (Array.isArray(items) && items.length > 0) {
        return items.map(parseMarket);
      }

      lastError = `${endpoint}: no market items returned`;
    } catch (error) {
      lastError = error instanceof Error ? `${endpoint}: ${error.message}` : `${endpoint}: unknown error`;
    }
  }

  throw new Error(lastError);
}
