import type { YieldResult } from '../types';
import { formatPct, formatUsd, verifyYieldIdentity } from '../utils/yieldMath';

export function SimulationPanel({ result, principal }: { result: YieldResult; principal: number }) {
  const leveragedSupplyContribution = result.supplyApyUsed * result.effectiveLeverage;
  const borrowDragOnEquity = result.borrowCost;
  const annualBorrowDragUsd = principal * result.borrowCost;
  const mathDelta = verifyYieldIdentity(result);
  return (
    <section className="panel">
      <h3>SIMULATION OUTPUT</h3>
      <div className="metrics">
        <div><span>Gross APY</span><strong className={result.grossApy < 0 ? 'red' : 'green'}>{formatPct(result.grossApy)}</strong></div>
        <div><span>Net APY (fees disabled)</span><strong className={result.netApy < 0 ? 'red' : 'green'}>{formatPct(result.netApy)}</strong></div>
        <div><span>Supply APY used</span><strong>{formatPct(result.supplyApyUsed)}</strong></div>
        <div><span>Borrow APY used</span><strong>{formatPct(result.borrowApyUsed)}</strong></div>
        <div><span>Leveraged supply contribution</span><strong>{formatPct(leveragedSupplyContribution)}</strong></div>
        <div><span>Borrow drag (on equity)</span><strong>{formatPct(borrowDragOnEquity)}</strong></div>
        <div><span>Annual borrow drag ($)</span><strong>{formatUsd(annualBorrowDragUsd)}</strong></div>
        <div><span>Effective leverage</span><strong>{result.effectiveLeverage.toFixed(2)}x {result.capped ? '(CAPPED)' : ''}</strong></div>
        <div><span>Strategy target leverage</span><strong>{result.targetLeverage.toFixed(2)}x</strong></div>
        <div><span>Daily</span><strong>{formatUsd(result.dailyEarnings)}</strong></div>
        <div><span>Weekly</span><strong>{formatUsd(result.weeklyEarnings)}</strong></div>
        <div><span>Monthly</span><strong>{formatUsd(result.monthlyEarnings)}</strong></div>
        <div><span>Yearly</span><strong>{formatUsd(result.yearlyEarnings)}</strong></div>
      </div>
      <p className="muted">
        Math check: gross APY = (supply APY × effective leverage) − (borrow APY × (effective leverage − 1)).
      </p>
      <p className={mathDelta < 1e-9 ? 'green' : 'red'}>
        Equation consistency check: {mathDelta < 1e-9 ? 'PASS' : `MISMATCH (${(mathDelta * 100).toFixed(6)} bps)`}
      </p>
      {result.grossApy < 0 ? <p className="red">WARNING: Negative carry. Borrow cost exceeds leveraged supply yield.</p> : null}
    </section>
  );
}
