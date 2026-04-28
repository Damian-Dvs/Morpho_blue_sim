interface Props {
  dataSource: 'live' | 'fallback';
}

export function Header({ dataSource }: Props) {
  return (
    <header className="header panel">
      <div>
        <h1>MORPHO BLUE YIELD SIMULATOR</h1>
        <p className="muted">USDC LOOP STRATEGY ECONOMICS • FRONTEND FEE MODEL @ 10%</p>
      </div>
      <div className="header-status">
        <div className={`status-dot ${dataSource === 'live' ? 'live' : 'fallback'}`} />
        <span>{dataSource === 'live' ? 'LIVE API' : 'FALLBACK DATA'}</span>
        <span className="muted">{new Date().toUTCString()}</span>
      </div>
    </header>
  );
}
