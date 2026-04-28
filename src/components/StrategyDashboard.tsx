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
            <th>SELECTED MARKET</th>
            <th>TARGET LEV</th>
            <th>EFFECTIVE LEV</th>
            <th>GROSS APY</th>
            <th>YEARLY P&L / $10K</th>
          </tr>
        </thead>
        <tbody>
          {decisions.map(({ strategy, market, result }) => (
            <tr
              key={strategy.id}
              className={selectedStrategyId === strategy.id ? 'selected' : ''}
              onClick={() => {
                onSelectStrategy(strategy.id);
                onSelectMarket(market.uniqueKey);
              }}
            >
              <td>{strategy.label}</td>
              <td>{market.loanAssetSymbol}/{market.collateralAssetSymbol}</td>
              <td>{result.targetLeverage.toFixed(2)}x</td>
              <td>{result.effectiveLeverage.toFixed(2)}x {result.capped ? '(CAPPED)' : ''}</td>
              <td className={result.grossApy < 0 ? 'red' : 'green'}>{formatPct(result.grossApy)}</td>
              <td className={result.yearlyEarnings < 0 ? 'red' : 'green'}>{formatUsd(result.yearlyEarnings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Ranking rule: for each strategy, scan all pulled USDC markets and pick the market with highest net APY after strategy constraints.
      </p>
    </section>
  );
}
