export interface Market {
  uniqueKey: string;
  lltv: number;
  maxLeverage: number;
  supplyApy: number;
  borrowApy: number;
  netSupplyApy: number;
  netBorrowApy: number;
  totalSupplyUsd: number;
  totalBorrowUsd: number;
  loanAssetSymbol: string;
  collateralAssetSymbol: string;
}

export type StrategyId = 'safe' | 'balanced' | 'degen';

export interface Strategy {
  id: StrategyId;
  label: string;
  maxLeverage: number;
  utilization: number;
  description: string;
  riskColor: string;
}

export interface YieldResult {
  grossApy: number;
  netApy: number;
  feeApy: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  feeYearlyEarnings: number;
  effectiveLeverage: number;
  targetLeverage: number;
  borrowCost: number;
  capped: boolean;
  supplyApyUsed: number;
  borrowApyUsed: number;
}

export interface TvlScenario {
  tvl: number;
  annualFeePool: number;
}

export interface StrategyDecision {
  strategy: Strategy;
  mode: 'single' | 'multi';
  supplyMarket: Market;
  borrowMarket: Market;
  result: YieldResult;
  bestSingleResult: YieldResult;
  bestMultiResult: YieldResult;
}
