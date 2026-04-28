import { useEffect, useState } from 'react';
import { AmountInput } from './components/AmountInput';
import { Header } from './components/Header';
import { MarketTable } from './components/MarketTable';
import { SimulationPanel } from './components/SimulationPanel';
import { StrategyDashboard } from './components/StrategyDashboard';
import { StrategySelector } from './components/StrategySelector';
import { useMorphoMarkets } from './hooks/useMorphoMarkets';
import type { Strategy, StrategyDecision, StrategyId } from './types';
import { computeYield, computeYieldFromRates } from './utils/yieldMath';

const strategies: Strategy[] = [
  { id: 'safe', label: 'SAFE', maxLeverage: 1, utilization: 0, description: 'No loop. Minimal liquidation surface.', riskColor: '--blue' },
  { id: 'balanced', label: 'BALANCED', maxLeverage: 3, utilization: 0.65, description: 'Adaptive loop. Scales up only when carry is positive.', riskColor: '--amber' },
  { id: 'degen', label: 'DEGEN', maxLeverage: 5, utilization: 0.9, description: 'High-risk adaptive loop. Pushes closer to LLTV limits.', riskColor: '--red' },
];

export default function App() {
  const { markets, dataSource, error, updatedAt } = useMorphoMarkets();
  const [principalUsd, setPrincipalUsd] = useState(10_000);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>('safe');
  const [selectedMarketKey, setSelectedMarketKey] = useState('');

  useEffect(() => {
    if (!selectedMarketKey && markets.length > 0) {
      setSelectedMarketKey(markets[0].uniqueKey);
    }
  }, [markets, selectedMarketKey]);

  const decisions: StrategyDecision[] = strategies.map((strategy) => {
    const singleRanked = markets
      .map((market) => ({ market, result: computeYield(market, strategy, principalUsd) }))
      .sort((a, b) => b.result.netApy - a.result.netApy);

    const bestSingle = singleRanked[0];
    let bestMulti = {
      supplyMarket: bestSingle.market,
      borrowMarket: bestSingle.market,
      result: bestSingle.result,
    };

    const borrowCandidates = markets.filter((m) => m.totalBorrowUsd > 1_000_000 && m.borrowApy > 0.0025);
    const usableBorrowMarkets = borrowCandidates.length > 0 ? borrowCandidates : markets;

    for (const supplyMarket of markets) {
      for (const borrowMarket of usableBorrowMarkets) {
        const maxLeverage = Math.min(supplyMarket.maxLeverage, borrowMarket.maxLeverage);
        const result = computeYieldFromRates(
          supplyMarket.supplyApy,
          borrowMarket.borrowApy,
          maxLeverage,
          strategy,
          principalUsd
        );
        if (result.netApy > bestMulti.result.netApy) {
          bestMulti = { supplyMarket, borrowMarket, result };
        }
      }
    }

    const useMulti = bestMulti.result.netApy > bestSingle.result.netApy;
    return {
      strategy,
      mode: useMulti ? 'multi' : 'single',
      supplyMarket: useMulti ? bestMulti.supplyMarket : bestSingle.market,
      borrowMarket: useMulti ? bestMulti.borrowMarket : bestSingle.market,
      result: useMulti ? bestMulti.result : bestSingle.result,
      bestSingleResult: bestSingle.result,
      bestMultiResult: bestMulti.result,
    };
  });

  useEffect(() => {
    const chosen = decisions.find((d) => d.strategy.id === selectedStrategyId);
    if (chosen && chosen.supplyMarket.uniqueKey !== selectedMarketKey) {
      setSelectedMarketKey(chosen.supplyMarket.uniqueKey);
    }
  }, [decisions, selectedStrategyId, selectedMarketKey]);

  const selectedMarket = markets.find((m) => m.uniqueKey === selectedMarketKey) ?? markets[0];
  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) ?? strategies[0];
  const selectedDecision = decisions.find((d) => d.strategy.id === selectedStrategyId);
  const result = selectedDecision?.result ?? (selectedMarket ? computeYield(selectedMarket, selectedStrategy, principalUsd) : null);

  if (!selectedMarket || !result) return null;

  return (
    <div className="app">
      <Header dataSource={dataSource} updatedAt={updatedAt} />
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
        <SimulationPanel result={result} principal={principalUsd} />
      </section>
    </div>
  );
}
