import { useMemo, useState } from 'react';
import type { YieldResult } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

interface BacktestPoint {
  day: number;
  balance: number;
}

interface Props {
  principal: number;
  result: YieldResult;
}

function buildBacktest(principal: number, netApy: number, horizonDays: number, rebalanceEveryDays: number, rebalanceCostUsd: number): BacktestPoint[] {
  const points: BacktestPoint[] = [{ day: 0, balance: principal }];
  const dailyRate = netApy / 365;
  let balance = principal;

  for (let day = 1; day <= horizonDays; day += 1) {
    balance = balance * (1 + dailyRate);
    if (rebalanceEveryDays > 0 && day % rebalanceEveryDays === 0) {
      balance -= rebalanceCostUsd;
    }
    balance = Math.max(0, balance);
    points.push({ day, balance });
  }

  return points;
}

export function BacktestPanel({ principal, result }: Props) {
  const [months, setMonths] = useState(12);
  const [rebalanceEveryDays, setRebalanceEveryDays] = useState(7);
  const [rebalanceCostUsd, setRebalanceCostUsd] = useState(8);

  const horizonDays = months * 30;

  const points = useMemo(
    () => buildBacktest(principal, result.netApy, horizonDays, rebalanceEveryDays, rebalanceCostUsd),
    [principal, result.netApy, horizonDays, rebalanceEveryDays, rebalanceCostUsd]
  );

  const finalBalance = points[points.length - 1]?.balance ?? principal;
  const totalPnl = finalBalance - principal;
  const rebalanceCount = rebalanceEveryDays > 0 ? Math.floor(horizonDays / rebalanceEveryDays) : 0;
  const totalRebalanceCost = rebalanceCount * rebalanceCostUsd;

  const sampled = points.filter((_, idx) => idx % 30 === 0 || idx === points.length - 1);
  const minBalance = Math.min(...sampled.map((p) => p.balance));
  const maxBalance = Math.max(...sampled.map((p) => p.balance));
  const spread = Math.max(1, maxBalance - minBalance);

  return (
    <section className="panel">
      <h3>VISUAL BACKTESTER (SIMULATED)</h3>
      <div className="metrics">
        <div>
          <span>Backtest horizon</span>
          <strong>{months} months ({horizonDays} days)</strong>
        </div>
        <div>
          <span>Model APY (net)</span>
          <strong className={result.netApy < 0 ? 'red' : 'green'}>{formatPct(result.netApy)}</strong>
        </div>
        <div>
          <span>Rebalance cadence</span>
          <strong>Every {rebalanceEveryDays} days</strong>
        </div>
        <div>
          <span>Total rebalance costs</span>
          <strong>{formatUsd(totalRebalanceCost)}</strong>
        </div>
        <div>
          <span>Ending balance</span>
          <strong className={totalPnl < 0 ? 'red' : 'green'}>{formatUsd(finalBalance)}</strong>
        </div>
        <div>
          <span>Total PnL</span>
          <strong className={totalPnl < 0 ? 'red' : 'green'}>{formatUsd(totalPnl)}</strong>
        </div>
      </div>

      <div className="backtest-controls">
        <label>
          Horizon (months): {months}
          <input type="range" min={3} max={36} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
        </label>
        <label>
          Rebalance every (days): {rebalanceEveryDays}
          <input type="range" min={1} max={30} step={1} value={rebalanceEveryDays} onChange={(e) => setRebalanceEveryDays(Number(e.target.value))} />
        </label>
        <label>
          Estimated cost per rebalance ($): {rebalanceCostUsd}
          <input type="range" min={0} max={50} step={1} value={rebalanceCostUsd} onChange={(e) => setRebalanceCostUsd(Number(e.target.value))} />
        </label>
      </div>

      <div className="backtest-chart">
        {sampled.map((point) => {
          const widthPct = ((point.balance - minBalance) / spread) * 100;
          return (
            <div key={point.day} className="backtest-row">
              <span>D{point.day}</span>
              <div className="backtest-bar-wrap">
                <div className="backtest-bar" style={{ width: `${Math.max(2, widthPct)}%` }} />
              </div>
              <strong>{formatUsd(point.balance)}</strong>
            </div>
          );
        })}
      </div>

      <p className="muted">
        This backtest uses constant APY and deterministic rebalance costs. It is a sanity-check visualizer, not a full market impact simulator.
      </p>
    </section>
  );
}
