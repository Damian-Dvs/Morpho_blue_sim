interface Props {
  dataSource: 'live' | 'fallback';
  updatedAt: Date | null;
}

export function Header({ dataSource, updatedAt }: Props) {
  return (
    <header className="header panel">
      <div>
        <h1>MORPHO BLUE YIELD SIMULATOR</h1>
        <p className="muted">USDC LOOP STRATEGY EXPLORER • SINGLE VS MULTI-MARKET OPTIMIZATION</p>
      </div>
      <div className="header-status">
        <div className={`status-dot ${dataSource === 'live' ? 'live' : 'fallback'}`} />
        <span>{dataSource === 'live' ? 'LIVE API' : 'FALLBACK DATA'}</span>
        <span className="muted">Last refresh: {updatedAt ? updatedAt.toUTCString() : 'waiting...'}</span>
      </div>
    </header>
  );
}
