import type { TvlScenario } from '../types';
import { formatUsd } from '../utils/yieldMath';

interface Props {
  scenarios: TvlScenario[];
  index: number;
  onIndex: (index: number) => void;
}

export function TVLScenario({ scenarios, index, onIndex }: Props) {
  const current = scenarios[index];
  return (
    <section className="panel">
      <h3>WHAT IF TVL SCALE</h3>
      <input
        type="range"
        min={0}
        max={scenarios.length - 1}
        step={1}
        value={index}
        onChange={(e) => onIndex(Number(e.target.value))}
      />
      <div className="row between">
        {scenarios.map((s, i) => (
          <button key={s.tvl} className={`btn ${index === i ? 'selected' : ''}`} onClick={() => onIndex(i)}>
            {formatUsd(s.tvl)}
          </button>
        ))}
      </div>
      <p className="green">Annual fee pool @ {formatUsd(current.tvl)} TVL: {formatUsd(current.annualFeePool)}</p>
    </section>
  );
}
