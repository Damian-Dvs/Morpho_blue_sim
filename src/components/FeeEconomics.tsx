import type { YieldResult } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

export function FeeEconomics({ result, principal }: { result: YieldResult; principal: number }) {
  return (
    <section className="panel">
      <h3>FEE ECONOMICS</h3>
      <div className="metrics">
        <div><span>Fee clip</span><strong>10.00%</strong></div>
        <div><span>Fee APY on principal</span><strong>{formatPct(result.feeApy)}</strong></div>
        <div><span>Annual fee from this deposit</span><strong className="green">{formatUsd(result.feeYearlyEarnings)}</strong></div>
        <div><span>Deposit simulated</span><strong>{formatUsd(principal)}</strong></div>
      </div>
    </section>
  );
}
