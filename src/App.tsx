import { useEffect, useState } from 'react';
import { AmountInput } from './components/AmountInput';
import { Header } from './components/Header';
import { MarketTable } from './components/MarketTable';
import { SimulationPanel } from './components/SimulationPanel';
import { StrategyDashboard } from './components/StrategyDashboard';
import { StrategySelector } from './components/StrategySelector';
import { useMorphoMarkets } from './hooks/useMorphoMarkets';
import type { Strategy, StrategyDecision, StrategyId } from './types';
import { computeYield } from './utils/yieldMath';

const strategies: Strategy[] = [
  { id: 'safe', label: 'SAFE', maxLeverage: 1, utilization: 0, description: 'No loop. Minimal liquidation surface.', riskColor: '--blue' },
  { id: 'balanced', label: 'BALANCED', maxLeverage: 3, utilization: 0.65, description: 'Adaptive loop. Scales up only when carry is positive.', riskColor: '--amber' },
  { id: 'degen', label: 'DEGEN', maxLeverage: 5, utilization: 0.9, description: 'High-risk adaptive loop. Pushes closer to LLTV limits.', riskColor: '--red' },
];

export default function App() {
  const { markets, dataSource, error } = useMorphoMarkets();
  const [principalUsd, setPrincipalUsd] = useState(10_000);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>('safe');
  const [selectedMarketKey, setSelectedMarketKey] = useState('');

  useEffect(() => {
    if (!selectedMarketKey && markets.length > 0) {
      setSelectedMarketKey(markets[0].uniqueKey);
    }
  }, [markets, selectedMarketKey]);

  const decisions: StrategyDecision[] = strategies.map((strategy) => {
    const ranked = markets
      .map((market) => ({ market, result: computeYield(market, strategy, principalUsd) }))
      .sort((a, b) => b.result.netApy - a.result.netApy);

    const best = ranked[0];
    return { strategy, market: best.market, result: best.result };
  });

  useEffect(() => {
    const chosen = decisions.find((d) => d.strategy.id === selectedStrategyId);
    if (chosen && chosen.market.uniqueKey !== selectedMarketKey) {
      setSelectedMarketKey(chosen.market.uniqueKey);
    }
  }, [decisions, selectedStrategyId, selectedMarketKey]);

  const selectedMarket = markets.find((m) => m.uniqueKey === selectedMarketKey) ?? markets[0];
  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) ?? strategies[0];
  const result = selectedMarket ? computeYield(selectedMarket, selectedStrategy, principalUsd) : null;

  if (!selectedMarket || !result) return null;

  return (
    <div className="app">
      <Header dataSource={dataSource} />
      {error ? <p className="panel amber">API issue: {error}. Using fallback market snapshot.</p> : null}

      <section className="layout-top">
        <div className="left-col">
          <AmountInput value={principalUsd} onChange={setPrincipalUsd} />
          <StrategySelector strategies={strategies} selected={selectedStrategyId} onSelect={setSelectedStrategyId} />
        </div>
        <MarketTable markets={markets} selectedKey={selectedMarket.uniqueKey} onSelect={setSelectedMarketKey} />
      </section>

      <StrategyDashboard
        decisions={decisions}
        selectedStrategyId={selectedStrategyId}
        onSelectStrategy={setSelectedStrategyId}
        onSelectMarket={setSelectedMarketKey}
      />

      <section className="layout-bottom">
        <SimulationPanel result={result} />
      </section>
    </div>
  );
}
