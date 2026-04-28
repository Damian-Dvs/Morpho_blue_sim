import type { Market, Strategy, TvlScenario, YieldResult } from '../types';

export const PERFORMANCE_FEE = 0;

export function wadToDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return Math.abs(value) > 1 ? value / 1e18 : value;
  }

  const text = String(value).trim();
  if (!text) return 0;

  if (text.includes('.') || text.toLowerCase().includes('e')) {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  try {
    const bi = BigInt(text);
    if (text.length > 15) {
      return Number(bi) / 1e18;
    }
    return Number(bi);
  } catch {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

export function computeGrossApy(supplyApy: number, borrowApy: number, leverage: number): number {
  return supplyApy * leverage - borrowApy * (leverage - 1);
}

function chooseTargetLeverage(market: Market, strategy: Strategy, maxAllowed: number): number {
  if (strategy.id === 'safe') return 1;

  const maxByStrategy = Math.min(strategy.maxLeverage, maxAllowed);
  if (maxByStrategy <= 1) return 1;

  const carryIsPositive = market.supplyApy > market.borrowApy;
  if (!carryIsPositive) return 1;

  return 1 + (maxByStrategy - 1) * strategy.utilization;
}

export function computeYield(market: Market, strategy: Strategy, principalUsd: number): YieldResult {
  const maxAllowed = market.maxLeverage * 0.95;
  const targetLeverage = chooseTargetLeverage(market, strategy, maxAllowed);
  const effectiveLeverage = Math.min(targetLeverage, maxAllowed);
  const capped = effectiveLeverage < targetLeverage;

  const grossApy = computeGrossApy(market.supplyApy, market.borrowApy, effectiveLeverage);
  const netApy = grossApy * (1 - PERFORMANCE_FEE);
  const feeApy = grossApy * PERFORMANCE_FEE;

  const yearlyEarnings = principalUsd * netApy;
  const feeYearlyEarnings = principalUsd * feeApy;

  return {
    grossApy,
    netApy,
    feeApy,
    dailyEarnings: yearlyEarnings / 365,
    weeklyEarnings: yearlyEarnings / 52,
    monthlyEarnings: yearlyEarnings / 12,
    yearlyEarnings,
    feeYearlyEarnings,
    effectiveLeverage,
    targetLeverage,
    borrowCost: market.borrowApy * Math.max(0, effectiveLeverage - 1),
    capped,
  };
}

export function computeTvlScenarios(feeApy: number): TvlScenario[] {
  const tvls = [1_000_000, 10_000_000, 50_000_000, 100_000_000];
  return tvls.map((tvl) => ({ tvl, annualFeePool: tvl * feeApy }));
}

export const formatPct = (v: number): string => `${(v * 100).toFixed(2)}%`;
export const formatUsd = (v: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
