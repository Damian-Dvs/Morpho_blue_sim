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

function chooseTargetLeverageFromRates(supplyApy: number, borrowApy: number, strategy: Strategy, maxAllowed: number): number {
  if (strategy.id === 'safe') return 1;

  const maxByStrategy = Math.min(strategy.maxLeverage, maxAllowed);
  if (maxByStrategy <= 1) return 1;

  const carryIsPositive = supplyApy > borrowApy;
  if (!carryIsPositive) return 1;

  return 1 + (maxByStrategy - 1) * strategy.utilization;
}

export function computeYieldFromRates(
  supplyApy: number,
  borrowApy: number,
  maxLeverage: number,
  strategy: Strategy,
  principalUsd: number
): YieldResult {
  const maxAllowed = maxLeverage * 0.95;
  const targetLeverage = chooseTargetLeverageFromRates(supplyApy, borrowApy, strategy, maxAllowed);
  const effectiveLeverage = Math.min(targetLeverage, maxAllowed);
  const capped = effectiveLeverage < targetLeverage;

  const grossApy = computeGrossApy(supplyApy, borrowApy, effectiveLeverage);
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
    borrowCost: borrowApy * Math.max(0, effectiveLeverage - 1),
    capped,
    supplyApyUsed: supplyApy,
    borrowApyUsed: borrowApy,
  };
}

export function computeYield(market: Market, strategy: Strategy, principalUsd: number): YieldResult {
  return computeYieldFromRates(market.supplyApy, market.borrowApy, market.maxLeverage, strategy, principalUsd);
}

export function computeTvlScenarios(feeApy: number): TvlScenario[] {
  const tvls = [1_000_000, 10_000_000, 50_000_000, 100_000_000];
  return tvls.map((tvl) => ({ tvl, annualFeePool: tvl * feeApy }));
}

export const formatPct = (v: number): string => `${(v * 100).toFixed(2)}%`;
export const formatUsd = (v: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
