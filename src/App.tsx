import { useEffect, useState } from 'react';
import { AmountInput } from './components/AmountInput';
import { FeeEconomics } from './components/FeeEconomics';
import { Header } from './components/Header';
import { MarketTable } from './components/MarketTable';
import { SimulationPanel } from './components/SimulationPanel';
import { StrategySelector } from './components/StrategySelector';
import { TVLScenario } from './components/TVLScenario';
import { useMorphoMarkets } from './hooks/useMorphoMarkets';
import type { Strategy, StrategyId } from './types';
import { computeTvlScenarios, computeYield } from './utils/yieldMath';

const strategies: Strategy[] = [
  { id: 'safe', label: 'SAFE', leverage: 1, description: 'No loop. Minimal liquidation surface.', riskColor: '--blue' },
  { id: 'balanced', label: 'BALANCED', leverage: 2, description: '2x loop for better carry / moderate risk.', riskColor: '--amber' },
  { id: 'degen', label: 'DEGEN', leverage: 3.5, description: 'Aggressive loop. Highest sensitivity to borrow swings.', riskColor: '--red' },
];

export default function App() {
  const { markets, dataSource, error } = useMorphoMarkets();
  const [principalUsd, setPrincipalUsd] = useState(10_000);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>('safe');
  const [selectedMarketKey, setSelectedMarketKey] = useState('');
  const [tvlScenarioIndex, setTvlScenarioIndex] = useState(2);

  useEffect(() => {
    if (!selectedMarketKey && markets.length > 0) {
      setSelectedMarketKey(markets[0].uniqueKey);
    }
  }, [markets, selectedMarketKey]);

  const selectedMarket = markets.find((m) => m.uniqueKey === selectedMarketKey) ?? markets[0];
  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) ?? strategies[0];
  const result = selectedMarket ? computeYield(selectedMarket, selectedStrategy, principalUsd) : null;
  const scenarios = result ? computeTvlScenarios(result.feeApy) : [];

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

      <section className="layout-bottom">
        <SimulationPanel result={result} />
        <FeeEconomics result={result} principal={principalUsd} />
      </section>

      <TVLScenario scenarios={scenarios} index={Math.min(tvlScenarioIndex, scenarios.length - 1)} onIndex={setTvlScenarioIndex} />
    </div>
  );
}
