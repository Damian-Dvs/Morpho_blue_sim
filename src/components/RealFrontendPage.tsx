import type { Market, StrategyDecision } from '../types';
import { formatPct } from '../utils/yieldMath';

interface Props {
  selectedDecision: StrategyDecision | undefined;
  selectedMarket: Market;
}

const flow = [
  '1) Pull live market + user position state',
  '2) Build action bundle (repay / withdraw / supply / borrow)',
  '3) Simulate post-trade leverage + liquidation buffer',
  '4) Enforce guardrails (min APY delta, max slippage, max gas)',
  '5) Sign and submit transaction bundle',
  '6) Re-read chain state and store an audit record',
];

const guards = [
  'Health factor / liquidation buffer threshold',
  'Borrow utilization + liquidity depth checks',
  'Oracle freshness and stale price protection',
  'Cooldown period to avoid over-trading',
  'Net benefit after gas + swap + bridge costs',
];

export function RealFrontendPage({ selectedDecision, selectedMarket }: Props) {
  return (
    <section className="panel">
      <h3>REAL MORPHO FRONT END (NO NEW SMART CONTRACTS)</h3>

      <div className="metrics">
        <div>
          <span>Will rebalancing be automatic?</span>
          <strong>No, not by default.</strong>
          <p className="muted">Every rebalance is an on-chain transaction. A user wallet signature (or delegated automation) is required.</p>
        </div>
        <div>
          <span>Do users need to sign?</span>
          <strong>Yes, unless delegated.</strong>
          <p className="muted">You can support one-click UX with signatures + relayers, but execution still needs valid authorization.</p>
        </div>
        <div>
          <span>Current selected route</span>
          <strong>{selectedDecision ? selectedDecision.mode.toUpperCase() : 'N/A'} · {selectedMarket.loanAssetSymbol}/{selectedMarket.collateralAssetSymbol}</strong>
          <p className="muted">Model net APY: {selectedDecision ? formatPct(selectedDecision.result.netApy) : 'N/A'}.</p>
        </div>
        <div>
          <span>How Morpho Blue works (simple)</span>
          <strong>Permissionless isolated markets.</strong>
          <p className="muted">Each market has its own collateral + loan asset + LLTV + oracle/IRM config. Your UI composes actions on top.</p>
        </div>
      </div>

      <h3 style={{ marginTop: 12 }}>REBALANCE EXECUTOR FLOW</h3>
      <ul>
        {flow.map((item) => (
          <li key={item} className="muted" style={{ marginBottom: 6 }}>{item}</li>
        ))}
      </ul>

      <h3 style={{ marginTop: 12 }}>RECOMMENDED SAFETY GUARDS</h3>
      <ul>
        {guards.map((item) => (
          <li key={item} className="muted" style={{ marginBottom: 6 }}>{item}</li>
        ))}
      </ul>

      <p className="amber" style={{ marginTop: 10 }}>
        Production note: auto-rebalancing without user signatures requires explicit delegated permissions (session keys / automation service) and strict risk limits.
      </p>
    </section>
  );
}
