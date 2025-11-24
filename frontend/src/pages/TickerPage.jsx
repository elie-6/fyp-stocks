// src/pages/TickerPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import TickerHistoryList from '../components/TickerHistoryList';
import TickerIndicatorsList from '../components/TickerIndicatorsList';
import TradingViewWidget from '../components/TradingViewWidget'; // <-- import widget
import { Sparklines, SparklinesLine } from 'react-sparklines';
import IndicatorsChart from '../components/IndicatorsChart';
import BullishScoreOverview from '../components/BullishScoreOverview'; // new

export default function TickerPage() {
  const { ticker } = useParams();

  return (
    <div className="ticker-page">
      <Header />

      <div className="page-inner" style={{ padding: '2rem' }}>
        {/* Section title */}
        <div className="section-title">{ticker} — Ticker Overview</div>

        {/* Hero */}
        <HeroSection ticker={ticker} />

        {/* Main content: indicators strip, main chart, recent table */}
        <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
          {/* Indicators Strip */}
          <TickerIndicatorsList ticker={ticker}>
            {({ data: indicators = [], loading: indLoading, error: indError }) => {
              if (indLoading) return <p>Loading indicators...</p>;
              if (indError) return <p>Error loading indicators: {indError}</p>;
              if (!indicators.length) return <p>No indicator data available</p>;

              const last = indicators.slice(-60);

              const keys = [
                { key: 'RSI14_norm', label: 'RSI14' },
                { key: 'EMA50_dist_norm', label: 'EMA50 dist' },
                { key: 'ROC_10_norm', label: 'ROC(10)' },
                { key: 'ATR_pct_norm', label: 'ATR %' },
                { key: 'bullish_score', label: 'Bullish Score' },
              ];

              return (
                <section className="indicators-strip" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {keys.map((k) => {
                    const series = last.map((r) => r[k.key] == null ? 0 : Number(r[k.key]));
                    const latestVal = last[last.length - 1]?.[k.key];
                    const displayVal = typeof latestVal === 'number' 
                      ? (k.key === 'bullish_score' ? (latestVal * 100).toFixed(2) : Number(latestVal).toFixed(2)) 
                      : 'N/A';

                    return (
                      <div key={k.key} className="indicator-card" style={{ minWidth: 160, padding: '0.6rem 0.8rem', background: 'linear-gradient(145deg,#0f1418,#0a0d10)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 12, color: '#b0b8c1' }}>{k.label}</div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{displayVal}</div>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <Sparklines data={series} svgHeight={40} svgWidth={140}>
                            <SparklinesLine color="#60a5fa" />
                          </Sparklines>
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            }}
          </TickerIndicatorsList>

          {/* Main Chart: TradingView Widget */}
          <section className="main-chart" style={{
            padding: '1rem 0 0 0',
            background: 'linear-gradient(145deg,#0f1317,#0c0f12)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.03)',
            width: '100%',
            minHeight: '600px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
              <h3 style={{ margin: 0 }}>Price Chart</h3>
              <div style={{ fontSize: 14, color: '#b0b8c1' }}>TradingView Candlestick</div>
            </div>

            <div style={{ flex: 1, width: '100%' }}> 
              <TradingViewWidget symbol={ticker} />
            </div>
          </section>

          {/* Recent Data Table - last 15 rows */}
          <div style={{ padding: '1rem', background: 'linear-gradient(145deg,#0f1317,#0c0f12)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
            <h3 style={{ marginTop: 0 }}>Recent Data (Last 15 rows)</h3>

            <TickerHistoryList ticker={ticker}>
              {({ data: history = [], loading: histLoading, error: histError }) => (
                <TickerIndicatorsList ticker={ticker}>
                  {({ data: indicators = [], loading: indLoading, error: indError }) => {
                    if (histLoading || indLoading) return <p>Loading table...</p>;
                    if (histError) return <p>Error loading history: {histError}</p>;
                    if (indError) return <p>Error loading indicators: {indError}</p>;
                    if (!history.length) return <p>No data to show</p>;

                    const indMap = {};
                    indicators.forEach((r) => {
                      indMap[String(r.timestamp ?? r.date ?? '')] = r;
                    });

                    const rows = history.slice(-15).map((r) => {
                      const key = String(r.timestamp ?? r.date ?? '');
                      return {
                        date: r.date || (r.timestamp ? new Date(Number(r.timestamp)).toISOString().slice(0,10) : ''),
                        open: r.open,
                        high: r.high,
                        low: r.low,
                        close: r.close,
                        volume: r.volume,
                        indicators: indMap[key] || null,
                      };
                    });

                    return (
                      <>
                        <div style={{ overflowX: 'auto', marginTop: 8 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                            <thead>
                              <tr style={{ textAlign: 'left', color: '#B0B8C1', fontSize: 13 }}>
                                <th style={{ padding: '8px 6px' }}>Date</th>
                                <th style={{ padding: '8px 6px' }}>Open</th>
                                <th style={{ padding: '8px 6px' }}>High</th>
                                <th style={{ padding: '8px 6px' }}>Low</th>
                                <th style={{ padding: '8px 6px' }}>Close</th>
                                <th style={{ padding: '8px 6px' }}>Volume</th>
                                <th style={{ padding: '8px 6px' }}>Bullish</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '8px 6px' }}>{row.date}</td>
                                  <td style={{ padding: '8px 6px' }}>{row.open}</td>
                                  <td style={{ padding: '8px 6px' }}>{row.high}</td>
                                  <td style={{ padding: '8px 6px' }}>{row.low}</td>
                                  <td style={{ padding: '8px 6px' }}>{row.close}</td>
                                  <td style={{ padding: '8px 6px' }}>{row.volume}</td>
                                  <td style={{ padding: '8px 6px' }}>
                                    {row.indicators && typeof row.indicators.bullish_score === 'number'
                                      ? (row.indicators.bullish_score * 100).toFixed(2)
                                      : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Indicators Chart Section */}
                        <section style={{ marginTop: 16, padding: '1rem', background: 'linear-gradient(145deg,#0f1317,#0c0f12)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                          <h3 style={{ marginBottom: 12 }}>Relational Indicators</h3>
                          <div style={{ height: 320 }}>
                            <IndicatorsChart ticker={ticker} />
                          </div>
                        </section>
                      </>
                    );
                  }}
                </TickerIndicatorsList>
              )}
            </TickerHistoryList>
          </div>

          {/* Bullish Score Overview Section */}
          <BullishScoreOverview ticker={ticker} />
        </div>
      </div>
    </div>
  );
}
