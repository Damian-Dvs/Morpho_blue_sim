import type { YieldResult } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

export function SimulationPanel({ result }: { result: YieldResult }) {
  return (
    <section className="panel">
      <h3>SIMULATION OUTPUT</h3>
      <div className="metrics">
        <div><span>Gross APY</span><strong className={result.grossApy < 0 ? 'red' : 'green'}>{formatPct(result.grossApy)}</strong></div>
        <div><span>Net APY (after 10% fee)</span><strong className={result.netApy < 0 ? 'red' : 'green'}>{formatPct(result.netApy)}</strong></div>
        <div><span>Borrow drag</span><strong>{formatPct(result.borrowCost)}</strong></div>
        <div><span>Effective leverage</span><strong>{result.effectiveLeverage.toFixed(2)}x {result.capped ? '(CAPPED)' : ''}</strong></div>
        <div><span>Strategy target leverage</span><strong>{result.targetLeverage.toFixed(2)}x</strong></div>
        <div><span>Daily</span><strong>{formatUsd(result.dailyEarnings)}</strong></div>
        <div><span>Weekly</span><strong>{formatUsd(result.weeklyEarnings)}</strong></div>
        <div><span>Monthly</span><strong>{formatUsd(result.monthlyEarnings)}</strong></div>
        <div><span>Yearly</span><strong>{formatUsd(result.yearlyEarnings)}</strong></div>
      </div>
      {result.grossApy < 0 ? <p className="red">WARNING: Negative carry. Borrow cost exceeds leveraged supply yield.</p> : null}
    </section>
  );
}
