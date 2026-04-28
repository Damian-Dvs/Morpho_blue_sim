import { useMemo, useState } from 'react';
import type { Market, Strategy } from '../types';
import { computeYield, computeYieldFromRates, formatPct, formatUsd } from '../utils/yieldMath';

interface Props {
  markets: Market[];
  strategy: Strategy;
  principalUsd: number;
}

interface AllocationRow {
  market: Market;
  weight: number;
  principal: number;
  netApy: number;
  yearly: number;
  stressedNetApy: number;
}

export function MultiPoolSimulator({ markets, strategy, principalUsd }: Props) {
  const [maxPools, setMaxPools] = useState(3);

  const rows = useMemo<AllocationRow[]>(() => {
    const candidates = markets
      .map((market) => {
        const result = computeYield(market, strategy, principalUsd);
        const stressed = computeYieldFromRates(
          market.supplyApy * 0.8,
          market.borrowApy * 1.2,
          market.maxLeverage,
          strategy,
          principalUsd
        );

        const liquidityScore = Math.sqrt(Math.max(1, market.totalSupplyUsd));
        const edge = Math.max(0.00001, result.netApy + 0.02);
        const score = edge * liquidityScore;

        return {
          market,
          score,
          netApy: result.netApy,
          stressedNetApy: stressed.netApy,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPools);

    const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);

    return candidates.map((candidate) => {
      const weight = totalScore > 0 ? candidate.score / totalScore : 1 / Math.max(1, candidates.length);
      const principal = principalUsd * weight;
      return {
        market: candidate.market,
        weight,
        principal,
        netApy: candidate.netApy,
        yearly: principal * candidate.netApy,
        stressedNetApy: candidate.stressedNetApy,
      };
    });
  }, [markets, strategy, principalUsd, maxPools]);

  const blendedNetApy = rows.reduce((sum, row) => sum + row.weight * row.netApy, 0);
  const blendedStressedApy = rows.reduce((sum, row) => sum + row.weight * row.stressedNetApy, 0);
  const blendedYearly = rows.reduce((sum, row) => sum + row.yearly, 0);

  const concentratedBest = useMemo(() => {
    const ranked = markets
      .map((market) => ({ market, result: computeYield(market, strategy, principalUsd) }))
      .sort((a, b) => b.result.netApy - a.result.netApy)[0];

    return ranked;
  }, [markets, strategy, principalUsd]);

  const concentratedYearly = principalUsd * (concentratedBest?.result.netApy ?? 0);

  return (
    <section className="panel">
      <h3>MULTI-POOL DISTRIBUTION SIMULATOR</h3>
      <p className="muted">
        Yes — the old simulation mostly concentrated into one best route. This simulator distributes capital across the top pools using APY + liquidity scoring.
      </p>

      <div className="backtest-controls">
        <label>
          Max pools to distribute across: {maxPools}
          <input type="range" min={2} max={6} step={1} value={maxPools} onChange={(e) => setMaxPools(Number(e.target.value))} />
        </label>
      </div>

      <div className="metrics">
        <div>
          <span>Concentrated best route APY</span>
          <strong className="green">{formatPct(concentratedBest?.result.netApy ?? 0)}</strong>
        </div>
        <div>
          <span>Diversified blended APY</span>
          <strong className="green">{formatPct(blendedNetApy)}</strong>
        </div>
        <div>
          <span>Concentrated yearly PnL</span>
          <strong>{formatUsd(concentratedYearly)}</strong>
        </div>
        <div>
          <span>Diversified yearly PnL</span>
          <strong>{formatUsd(blendedYearly)}</strong>
        </div>
        <div>
          <span>Stress test blended APY</span>
          <strong className={blendedStressedApy < 0 ? 'red' : 'amber'}>{formatPct(blendedStressedApy)}</strong>
        </div>
      </div>

      <table className="data-table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>MARKET</th>
            <th>WEIGHT</th>
            <th>ALLOCATED</th>
            <th>MODEL NET APY</th>
            <th>STRESS APY</th>
            <th>YEARLY PNL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.market.uniqueKey}>
              <td>{row.market.loanAssetSymbol}/{row.market.collateralAssetSymbol}</td>
              <td>{formatPct(row.weight)}</td>
              <td>{formatUsd(row.principal)}</td>
              <td className={row.netApy < 0 ? 'red' : 'green'}>{formatPct(row.netApy)}</td>
              <td className={row.stressedNetApy < 0 ? 'red' : 'amber'}>{formatPct(row.stressedNetApy)}</td>
              <td className={row.yearly < 0 ? 'red' : 'green'}>{formatUsd(row.yearly)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
