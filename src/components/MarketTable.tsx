import type { Market } from '../types';
import { formatPct, formatUsd } from '../utils/yieldMath';

interface Props {
  markets: Market[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function MarketTable({ markets, selectedKey, onSelect }: Props) {
  return (
    <section className="panel">
      <h3>TOP USDC MARKETS (BY SUPPLY APY)</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>PAIR</th>
            <th>SUPPLY APY</th>
            <th>BORROW APY</th>
            <th>TVL</th>
            <th>LLTV</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.uniqueKey} className={selectedKey === m.uniqueKey ? 'selected' : ''} onClick={() => onSelect(m.uniqueKey)}>
              <td>{m.loanAssetSymbol}/{m.collateralAssetSymbol}</td>
              <td className="green">{formatPct(m.supplyApy)}</td>
              <td>{formatPct(m.borrowApy)}</td>
              <td>{formatUsd(m.totalSupplyUsd)}</td>
              <td>{formatPct(m.lltv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
