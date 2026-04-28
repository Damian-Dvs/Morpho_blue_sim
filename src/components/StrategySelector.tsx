import type { Strategy, StrategyId } from '../types';

interface Props {
  strategies: Strategy[];
  selected: StrategyId;
  onSelect: (id: StrategyId) => void;
}

export function StrategySelector({ strategies, selected, onSelect }: Props) {
  return (
    <section className="panel">
      <h3>STRATEGY</h3>
      {strategies.map((s) => (
        <button
          key={s.id}
          className={`strategy ${selected === s.id ? 'selected' : ''}`}
          onClick={() => onSelect(s.id)}
          style={{ borderLeftColor: `var(${s.riskColor})` }}
        >
          <div className="row between">
            <span>{s.label}</span>
            <span>{s.leverage.toFixed(1)}x</span>
          </div>
          <p className="muted">{s.description}</p>
        </button>
      ))}
    </section>
  );
}
