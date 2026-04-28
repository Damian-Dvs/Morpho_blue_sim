import type { StrategyDecision, StrategyId } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

interface Props {
  decisions: StrategyDecision[];
  selectedStrategyId: StrategyId;
  onSelectStrategy: (id: StrategyId) => void;
  onSelectMarket: (key: string) => void;
}

export function StrategyDashboard({ decisions, selectedStrategyId, onSelectStrategy, onSelectMarket }: Props) {
  return (
    <section className="panel">
      <h3>STRATEGY DECISION DASHBOARD (BEST MARKET PER STRATEGY)</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>STRATEGY</th>
            <th>MODE</th>
            <th>SUPPLY MARKET</th>
            <th>BORROW MARKET</th>
            <th>TARGET LEV</th>
            <th>EFFECTIVE LEV</th>
            <th>GROSS APY</th>
            <th>SINGLE APY</th>
            <th>MULTI APY</th>
            <th>YEARLY P&L / $10K</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map(({ strategy, supplyMarket, borrowMarket, mode, result, bestSingleResult, bestMultiResult }) => (
            <tr
              key={strategy.id}
              className={selectedStrategyId === strategy.id ? 'selected' : ''}
              onClick={() => {
                onSelectStrategy(strategy.id);
                onSelectMarket(supplyMarket.uniqueKey);
              }}
            >
              <td>{strategy.label}</td>
              <td>{mode.toUpperCase()}</td>
              <td>{supplyMarket.loanAssetSymbol}/{supplyMarket.collateralAssetSymbol}</td>
              <td>{borrowMarket.loanAssetSymbol}/{borrowMarket.collateralAssetSymbol}</td>
              <td>{result.targetLeverage.toFixed(2)}x</td>
              <td>{result.effectiveLeverage.toFixed(2)}x {result.capped ? '(CAPPED)' : ''}</td>
              <td className={result.grossApy < 0 ? 'red' : 'green'}>{formatPct(result.grossApy)}</td>
              <td>{formatPct(bestSingleResult.netApy)}</td>
              <td>{formatPct(bestMultiResult.netApy)}</td>
              <td className={result.yearlyEarnings < 0 ? 'red' : 'green'}>{formatUsd(result.yearlyEarnings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Ranking rule: for each strategy, compare best single-market loop vs best cross-market (supply market + borrow market) loop, then pick the higher net APY.
      </p>
      <p className="muted">
        Borrow market quality filter: prioritize markets with borrow TVL &gt; $1M and borrow APY &gt; 0.25% to avoid zero-borrow ghost routes.
      </p>
    </section>
  );
}
