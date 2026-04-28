import { useMemo, useState } from 'react';
import type { Market, StrategyDecision, StrategyId } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

interface Props {
  principalUsd: number;
  decisions: StrategyDecision[];
  selectedDecision: StrategyDecision | undefined;
  selectedStrategyId: StrategyId;
  onSelectStrategy: (id: StrategyId) => void;
  selectedMarket: Market;
}

interface ActivityItem {
  at: string;
  message: string;
  level: 'ok' | 'warn';
}

const riskCopy: Record<StrategyId, string> = {
  safe: 'Capital preservation first. No leverage loops and highest liquidation buffer.',
  balanced: 'Controlled leverage with a defined safety margin. Better APY potential with moderate risk.',
  degen: 'Aggressive looping near LLTV boundaries. Highest return potential and highest liquidation risk.',
};

function shortTime() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function RealFrontendPage({
  principalUsd,
  decisions,
  selectedDecision,
  selectedStrategyId,
  onSelectStrategy,
  selectedMarket,
}: Props) {
  const [walletAddress, setWalletAddress] = useState('');
  const [depositAmount, setDepositAmount] = useState(principalUsd);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const activeDecision = selectedDecision ?? decisions[0];
  const bestDecision = useMemo(
    () => [...decisions].sort((a, b) => b.result.netApy - a.result.netApy)[0],
    [decisions]
  );

  const effectiveLeverage = activeDecision?.result.effectiveLeverage ?? 1;
  const liquidationBuffer = Math.max(0, 1 - effectiveLeverage / selectedMarket.maxLeverage);
  const healthScore = Math.max(0, Math.min(100, Math.round(liquidationBuffer * 100 * 1.3)));
  const loanExposure = depositAmount * Math.max(0, effectiveLeverage - 1);
  const totalSupplied = depositAmount * effectiveLeverage;

  const preDepositChecks = [
    `Wallet signature available: ${walletAddress ? 'YES' : 'NO (connect wallet required)'}`,
    `Selected route: ${activeDecision?.supplyMarket.loanAssetSymbol}/${activeDecision?.supplyMarket.collateralAssetSymbol} (${activeDecision?.mode.toUpperCase()})`,
    `Expected net APY: ${activeDecision ? formatPct(activeDecision.result.netApy) : 'N/A'}`,
    `Risk profile: ${selectedStrategyId.toUpperCase()} (${riskCopy[selectedStrategyId]})`,
  ];

  const depositSteps = [
    {
      title: '1) Approve token spending',
      detail: `You sign an approval for ${selectedMarket.loanAssetSymbol} so the vault router can move up to ${formatUsd(depositAmount)} for this strategy.`,
    },
    {
      title: '2) Supply to Morpho Blue market',
      detail: `The app supplies your ${selectedMarket.loanAssetSymbol} into ${activeDecision?.supplyMarket.loanAssetSymbol}/${activeDecision?.supplyMarket.collateralAssetSymbol}. You receive market position accounting immediately.`,
    },
    {
      title: '3) Looping logic (if risk profile uses leverage)',
      detail: `For ${selectedStrategyId.toUpperCase()}, target leverage is ${activeDecision?.result.targetLeverage.toFixed(2)}x. Estimated borrowed amount is ${formatUsd(loanExposure)} and total supplied is ${formatUsd(totalSupplied)}.`,
    },
    {
      title: '4) Post-trade health checks',
      detail: `Engine verifies liquidation buffer (${formatPct(liquidationBuffer)}), APY edge, and route validity before confirming execution to the user.`,
    },
    {
      title: '5) Continuous monitoring',
      detail: 'Dashboard monitors utilization, borrow cost drift, and route rankings. If the route is no longer best, user can trigger manual rebalance.',
    },
  ];

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setActivity((curr) => [
        { at: shortTime(), level: 'warn' as const, message: 'No wallet provider found. Install MetaMask/Rabby and retry.' },
        ...curr,
      ].slice(0, 8));
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const first = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : '';
      setWalletAddress(first);
      setActivity((curr) => [
        { at: shortTime(), level: 'ok' as const, message: `Wallet connected: ${first.slice(0, 6)}...${first.slice(-4)}` },
        ...curr,
      ].slice(0, 8));
    } catch {
      setActivity((curr) => [{ at: shortTime(), level: 'warn' as const, message: 'Wallet connection rejected.' }, ...curr].slice(0, 8));
    }
  };

  const runManualRebalance = () => {
    const msg =
      bestDecision && activeDecision && bestDecision.strategy.id !== activeDecision.strategy.id
        ? `Manual rebalance prepared: move from ${activeDecision.strategy.label} to ${bestDecision.strategy.label} (${formatPct(bestDecision.result.netApy)} expected net APY).`
        : 'Manual rebalance check complete: current route remains the top-ranked option.';

    setActivity((curr) => [{ at: shortTime(), level: 'ok' as const, message: msg }, ...curr].slice(0, 8));
  };

  return (
    <section className="production-page">
      <div className="hero-card panel">
        <div>
          <p className="eyebrow">MORPHO BLUE PRODUCTION APP</p>
          <h2>Connect wallet → choose risk → deposit → monitor health → rebalance manually</h2>
          <p className="muted">
            This interface is structured like a production dApp experience: transparent execution preview, explicit guardrails,
            and user-controlled manual rebalancing.
          </p>
        </div>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={connectWallet}>CONNECT WALLET</button>
          <button className="btn" onClick={runManualRebalance}>MANUAL REBALANCE</button>
        </div>
      </div>

      <div className="production-grid">
        <article className="panel glass">
          <h3>SESSION</h3>
          <div className="metrics single">
            <div>
              <span>Wallet status</span>
              <strong>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}</strong>
            </div>
            <div>
              <span>Current strategy</span>
              <strong>{activeDecision?.strategy.label ?? 'N/A'}</strong>
            </div>
            <div>
              <span>Current route</span>
              <strong>{activeDecision?.supplyMarket.loanAssetSymbol}/{activeDecision?.supplyMarket.collateralAssetSymbol}</strong>
            </div>
            <div>
              <span>Expected net APY</span>
              <strong className="green">{activeDecision ? formatPct(activeDecision.result.netApy) : 'N/A'}</strong>
            </div>
          </div>
        </article>

        <article className="panel glass">
          <h3>RISK PROFILE</h3>
          <div className="risk-switcher">
            {decisions.map((decision) => (
              <button
                key={decision.strategy.id}
                className={`strategy-card ${selectedStrategyId === decision.strategy.id ? 'selected' : ''}`}
                onClick={() => onSelectStrategy(decision.strategy.id)}
              >
                <p>{decision.strategy.label}</p>
                <strong>{formatPct(decision.result.netApy)}</strong>
                <span>{riskCopy[decision.strategy.id]}</span>
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="production-grid">
        <article className="panel glass">
          <h3>DEPOSIT PREVIEW (USDC EXAMPLE)</h3>
          <label className="muted">Deposit amount (USD notionally)</label>
          <input
            className="terminal-input"
            type="number"
            min={100}
            step={100}
            value={Math.round(depositAmount)}
            onChange={(e) => setDepositAmount(Math.max(100, Number(e.target.value) || 100))}
          />

          <div className="metrics">
            <div><span>You deposit</span><strong>{formatUsd(depositAmount)}</strong></div>
            <div><span>Total supplied after loops</span><strong>{formatUsd(totalSupplied)}</strong></div>
            <div><span>Total borrowed</span><strong>{formatUsd(loanExposure)}</strong></div>
            <div><span>Est. yearly return</span><strong className="green">{formatUsd(depositAmount * (activeDecision?.result.netApy ?? 0))}</strong></div>
          </div>

          <ul className="checklist">
            {preDepositChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </article>

        <article className="panel glass">
          <h3>POSITION HEALTH</h3>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${healthScore}%` }} />
          </div>
          <p style={{ marginTop: 8 }}><strong>Health score:</strong> {healthScore}/100</p>
          <p className="muted">Derived from leverage headroom vs market max leverage and current liquidation buffer.</p>

          <div className="metrics single">
            <div><span>Effective leverage</span><strong>{activeDecision?.result.effectiveLeverage.toFixed(2)}x</strong></div>
            <div><span>Liquidation buffer</span><strong>{formatPct(liquidationBuffer)}</strong></div>
            <div><span>Borrow APY</span><strong>{activeDecision ? formatPct(activeDecision.result.borrowApyUsed) : 'N/A'}</strong></div>
            <div><span>Supply APY</span><strong>{activeDecision ? formatPct(activeDecision.result.supplyApyUsed) : 'N/A'}</strong></div>
          </div>

          {bestDecision && activeDecision && bestDecision.strategy.id !== activeDecision.strategy.id ? (
            <p className="amber" style={{ marginTop: 10 }}>
              Better route detected: {bestDecision.strategy.label} at {formatPct(bestDecision.result.netApy)}. Use manual rebalance to migrate.
            </p>
          ) : (
            <p className="green" style={{ marginTop: 10 }}>Current route is top-ranked based on this APY model snapshot.</p>
          )}
        </article>
      </div>

      <article className="panel glass">
        <h3>WHAT HAPPENS WHEN YOU DEPOSIT?</h3>
        <div className="flow-list">
          {depositSteps.map((step) => (
            <div key={step.title} className="flow-item">
              <strong>{step.title}</strong>
              <p className="muted">{step.detail}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="panel glass">
        <h3>ACTIVITY FEED</h3>
        <div className="log-box">
          {activity.length === 0 ? <p className="muted">No actions yet.</p> : null}
          {activity.map((item, idx) => (
            <p key={`${item.at}-${idx}`} className={item.level === 'ok' ? 'green' : 'amber'}>
              [{item.at}] {item.message}
            </p>
          ))}
        </div>
      </article>
    </section>
  );
}
