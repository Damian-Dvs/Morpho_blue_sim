import { useEffect, useMemo, useState } from 'react';
import type { Market, StrategyDecision } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

interface Props {
  principal: number;
  selectedDecision: StrategyDecision | undefined;
  selectedMarket: Market;
}

interface RelayLog {
  at: string;
  level: 'ok' | 'warn';
  message: string;
}

function nowIsoShort() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function ProductionConsole({ principal, selectedDecision, selectedMarket }: Props) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [autoMode, setAutoMode] = useState(false);
  const [allowDelegatedAutomation, setAllowDelegatedAutomation] = useState(false);
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [minApyDeltaBps, setMinApyDeltaBps] = useState(80);
  const [minLiqBufferPct, setMinLiqBufferPct] = useState(10);
  const [lastExecutedAt, setLastExecutedAt] = useState<number>(0);
  const [logs, setLogs] = useState<RelayLog[]>([]);

  const strategyApy = selectedDecision?.result.netApy ?? 0;
  const effectiveLeverage = selectedDecision?.result.effectiveLeverage ?? 1;
  const maxLeverage = selectedMarket.maxLeverage;
  const liquidationBuffer = Math.max(0, 1 - effectiveLeverage / maxLeverage);

  const preflight = useMemo(() => {
    const reasons: string[] = [];

    if (!selectedDecision) reasons.push('No strategy decision selected.');
    if (strategyApy * 10_000 < minApyDeltaBps) reasons.push('Net APY edge below threshold.');
    if (liquidationBuffer * 100 < minLiqBufferPct) reasons.push('Liquidation buffer below safety threshold.');

    return {
      pass: reasons.length === 0,
      reasons,
    };
  }, [selectedDecision, strategyApy, minApyDeltaBps, liquidationBuffer, minLiqBufferPct]);

  const pushLog = (entry: RelayLog) => {
    setLogs((curr) => [entry, ...curr].slice(0, 14));
  };

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      pushLog({ at: nowIsoShort(), level: 'warn', message: 'No EIP-1193 wallet detected. Install a wallet to continue.' });
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : '';
      setWalletAddress(address);
      pushLog({ at: nowIsoShort(), level: 'ok', message: `Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}` });
    } catch {
      pushLog({ at: nowIsoShort(), level: 'warn', message: 'Wallet connection rejected.' });
    }
  };

  const canExecuteByCooldown = Date.now() - lastExecutedAt >= cooldownMinutes * 60_000;

  const triggerRebalance = (source: 'manual' | 'auto') => {
    if (!preflight.pass) {
      pushLog({ at: nowIsoShort(), level: 'warn', message: `Blocked ${source} rebalance: ${preflight.reasons.join(' ')}` });
      return;
    }

    if (!canExecuteByCooldown) {
      pushLog({ at: nowIsoShort(), level: 'warn', message: `Cooldown active (${cooldownMinutes}m). Rebalance skipped.` });
      return;
    }

    if (!walletAddress && !allowDelegatedAutomation) {
      pushLog({ at: nowIsoShort(), level: 'warn', message: 'Signature required: connect wallet or enable delegated automation.' });
      return;
    }

    setLastExecutedAt(Date.now());

    if (allowDelegatedAutomation) {
      pushLog({ at: nowIsoShort(), level: 'ok', message: `Relay executed ${source} rebalance via delegated policy.` });
      return;
    }

    pushLog({ at: nowIsoShort(), level: 'ok', message: `Signed ${source} rebalance submitted by ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}.` });
  };

  useEffect(() => {
    if (!autoMode) return;

    const id = setInterval(() => {
      triggerRebalance('auto');
    }, 15_000);

    return () => clearInterval(id);
  });

  return (
    <section className="panel">
      <h3>PRODUCTION EXECUTION CONSOLE</h3>
      <p className="muted">A frontend-only relay simulation with cooldown and guardrails. In production, wire this policy engine to your signed transaction relay API.</p>

      <div className="metrics">
        <div>
          <span>Wallet</span>
          <strong>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}</strong>
        </div>
        <div>
          <span>Selected route APY</span>
          <strong className={strategyApy < 0 ? 'red' : 'green'}>{formatPct(strategyApy)}</strong>
        </div>
        <div>
          <span>Liquidation buffer (est.)</span>
          <strong>{formatPct(liquidationBuffer)}</strong>
        </div>
        <div>
          <span>Principal monitored</span>
          <strong>{formatUsd(principal)}</strong>
        </div>
      </div>

      <div className="exec-grid">
        <label>
          Cooldown: {cooldownMinutes} minutes
          <input type="range" min={5} max={180} step={5} value={cooldownMinutes} onChange={(e) => setCooldownMinutes(Number(e.target.value))} />
        </label>
        <label>
          Min APY edge: {minApyDeltaBps} bps
          <input type="range" min={10} max={300} step={10} value={minApyDeltaBps} onChange={(e) => setMinApyDeltaBps(Number(e.target.value))} />
        </label>
        <label>
          Min liquidation buffer: {minLiqBufferPct}%
          <input type="range" min={5} max={30} step={1} value={minLiqBufferPct} onChange={(e) => setMinLiqBufferPct(Number(e.target.value))} />
        </label>
      </div>

      <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={connectWallet}>CONNECT WALLET</button>
        <button className="btn" onClick={() => triggerRebalance('manual')}>RUN MANUAL REBALANCE</button>
        <button className={`btn ${autoMode ? 'selected' : ''}`} onClick={() => setAutoMode((v) => !v)}>{autoMode ? 'AUTO MODE ON' : 'AUTO MODE OFF'}</button>
        <button className={`btn ${allowDelegatedAutomation ? 'selected' : ''}`} onClick={() => setAllowDelegatedAutomation((v) => !v)}>
          {allowDelegatedAutomation ? 'DELEGATED AUTOMATION ON' : 'DELEGATED AUTOMATION OFF'}
        </button>
      </div>

      <p className={preflight.pass ? 'green' : 'amber'} style={{ marginTop: 10 }}>
        Preflight: {preflight.pass ? 'PASS' : `BLOCKED — ${preflight.reasons.join(' ')}`}
      </p>

      <div className="log-box">
        {logs.length === 0 ? <p className="muted">No relay events yet.</p> : null}
        {logs.map((log, idx) => (
          <p key={`${log.at}-${idx}`} className={log.level === 'ok' ? 'green' : 'amber'}>
            [{log.at}] {log.message}
          </p>
        ))}
      </div>
    </section>
  );
}
