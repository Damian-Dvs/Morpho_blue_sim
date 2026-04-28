import type { Market, StrategyDecision } from '../types';
import { formatPct } from '../utils/yieldMath';

interface Props {
  selectedDecision: StrategyDecision | undefined;
  selectedMarket: Market;
}

const architecture = [
  {
    title: 'Portfolio Intelligence',
    text: 'Continuously fetch Morpho market state + wallet position state, then rank routes (single vs multi-market).',
  },
  {
    title: 'Risk Engine',
    text: 'Before every rebalance, enforce health buffer, slippage budget, stale-oracle checks, and max position-size rules.',
  },
  {
    title: 'Execution Layer',
    text: 'Build transaction bundles and submit via direct wallet signature or delegated relay policy.',
  },
  {
    title: 'Audit Layer',
    text: 'Persist decisions, signed payloads, and outcomes for user transparency and incident review.',
  },
];

const userSafetyRules = [
  'Never execute if net expected edge (after fees + gas) is negative.',
  'Use a mandatory cooldown after each rebalance to avoid churn.',
  'Cap leverage by policy lower than protocol hard limits.',
  'Block actions when oracle updates are stale or abnormal.',
  'Always preview expected post-trade liquidation buffer before signing.',
];

export function RealFrontendPage({ selectedDecision, selectedMarket }: Props) {
  return (
    <section className="panel">
      <h3>MORPHO BLUE — PRODUCTION FRONTEND BLUEPRINT</h3>
      <p className="muted" style={{ marginBottom: 10 }}>
        Morpho Blue lets you build advanced UX without deploying your own protocol contracts. You orchestrate user-authorized actions over existing markets.
      </p>

      <div className="metrics">
        <div>
          <span>Do users need to sign rebalances?</span>
          <strong>Yes (default path).</strong>
          <p className="muted">Auto-rebalancing requires delegated permissions/session policies, otherwise every rebalance needs a signature.</p>
        </div>
        <div>
          <span>Can this run fully automatic?</span>
          <strong>Yes, with a relay policy.</strong>
          <p className="muted">Use a backend relay only after explicit user consent and strict policy constraints.</p>
        </div>
        <div>
          <span>Selected strategy route</span>
          <strong>{selectedDecision ? selectedDecision.mode.toUpperCase() : 'N/A'} · {selectedMarket.loanAssetSymbol}/{selectedMarket.collateralAssetSymbol}</strong>
          <p className="muted">Current model net APY: {selectedDecision ? formatPct(selectedDecision.result.netApy) : 'N/A'}.</p>
        </div>
        <div>
          <span>What is Morpho Blue?</span>
          <strong>Isolated lending markets.</strong>
          <p className="muted">Markets are defined by collateral, loan asset, LLTV, oracle, and IRM. Your app chooses and executes actions safely.</p>
        </div>
      </div>

      <h3 style={{ marginTop: 14 }}>APP ARCHITECTURE</h3>
      <div className="card-grid">
        {architecture.map((item) => (
          <article className="guide-card" key={item.title}>
            <h4>{item.title}</h4>
            <p className="muted">{item.text}</p>
          </article>
        ))}
      </div>

      <h3 style={{ marginTop: 14 }}>NON-NEGOTIABLE USER SAFETY RULES</h3>
      <ul>
        {userSafetyRules.map((rule) => (
          <li key={rule} className="muted" style={{ marginBottom: 6 }}>{rule}</li>
        ))}
      </ul>

      <p className="amber" style={{ marginTop: 10 }}>
        Security posture: default to manual signing, make automation opt-in, and expose every guard + policy to the user in plain language.
      </p>
    </section>
  );
}
