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
  leverage: number;
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
  borrowCost: number;
  capped: boolean;
}

export interface TvlScenario {
  tvl: number;
  annualFeePool: number;
}
