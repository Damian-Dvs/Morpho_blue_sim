interface Props {
  value: number;
  onChange: (v: number) => void;
}

const presets = [1_000, 10_000, 50_000, 100_000];

export function AmountInput({ value, onChange }: Props) {
  return (
    <section className="panel">
      <h3>INPUT USDC</h3>
      <input
        className="terminal-input"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
      <div className="row presets">
        {presets.map((p) => (
          <button key={p} className="btn" onClick={() => onChange(p)}>
            ${p.toLocaleString()}
          </button>
        ))}
      </div>
    </section>
  );
}
