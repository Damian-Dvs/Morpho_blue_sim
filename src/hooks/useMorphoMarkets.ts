import { useEffect, useState } from 'react';
import { fallbackMarkets, fetchMorphoMarkets } from '../api/morpho';
import type { Market } from '../types';

export function useMorphoMarkets() {
  const [markets, setMarkets] = useState<Market[]>(fallbackMarkets);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback');

  useEffect(() => {
    let alive = true;

    const pull = async () => {
      try {
        const next = await fetchMorphoMarkets();
        if (!alive) return;
        setMarkets(next);
        setDataSource('live');
        setError(null);
      } catch (e) {
        if (!alive) return;
        setMarkets(fallbackMarkets);
        setDataSource('fallback');
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (alive) setLoading(false);
      }
    };

    pull();
    const id = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { markets, loading, error, dataSource };
}
