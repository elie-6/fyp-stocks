import React from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import TickerHistoryList from './TickerHistoryList';
import TickerIndicatorsList from './TickerIndicatorsList';
import './HeroSection.css';

export default function HeroSection({ ticker }) {
  // This component uses your render-prop children internally and
  // renders a compact hero with latest price + bullish score + small sparkline.
  return (
    <div className="hero-wrapper">
      <TickerHistoryList ticker={ticker}>
        {({ data: history = [], loading: histLoading, error: histError }) => (
          <TickerIndicatorsList ticker={ticker}>
            {({ data: indicators = [], loading: indLoading, error: indError }) => {
              // loading / error handling
              if (histLoading || indLoading) {
                return (
                  <div className="hero">
                    <div className="hero-left">
                      <h1 className="ticker-title">{ticker}</h1>
                      <div className="hero-meta">Loading…</div>
                    </div>
                    <div className="hero-right"> </div>
                  </div>
                );
              }

              if (histError || indError) {
                return (
                  <div className="hero">
                    <div className="hero-left">
                      <h1 className="ticker-title">{ticker}</h1>
                      <div className="hero-meta error">Error loading data</div>
                    </div>
                  </div>
                );
              }

              if (!history.length) {
                return (
                  <div className="hero">
                    <div className="hero-left">
                      <h1 className="ticker-title">{ticker}</h1>
                      <div className="hero-meta">No price data available</div>
                    </div>
                  </div>
                );
              }

              // Latest OHLCV row and closes for sparkline
              const latest = history[history.length - 1];
              const latestClose = Number(latest.close ?? 0);
              const closes = history.slice(-60).map((r) => Number(r.close ?? 0));

              // Bullish score from indicators (last row), scale 0-100 if exists
              const latestIndicator = indicators[indicators.length - 1] ?? {};
              const rawScore = latestIndicator.bullish_score;
              const scorePercent =
                typeof rawScore === 'number' ? (rawScore * 100).toFixed(2) : 'N/A';

              // Optional small percent change vs 7 days ago (if available)
              let pct7 = null;
              if (closes.length > 7) {
                const last = closes[closes.length - 1];
                const prev7 = closes[closes.length - 8];
                if (prev7 !== 0) pct7 = (((last - prev7) / prev7) * 100).toFixed(2);
              }

              // determine sparkline color using last vs 7 periods ago
              let lineColor = '#9CA3AF'; // fallback gray-ish
              if (closes.length >= 8) {
                const last = closes[closes.length - 1];
                const last7 = closes[closes.length - 8];
                lineColor = last > last7 ? 'lime' : last < last7 ? 'red' : '#9CA3AF';
              }

              return (
                <div className="hero">
                  <div className="hero-left">
                    <h1 className="ticker-title">{ticker}</h1>
                    <div className="hero-meta">
                      <span className="price">${latestClose.toLocaleString()}</span>
                      {pct7 !== null && (
                        <span className={`pct-change ${pct7 >= 0 ? 'pos' : 'neg'}`}>
                          {pct7 >= 0 ? '▲' : '▼'} {Math.abs(pct7)}%
                        </span>
                      )}
                    </div>
                    <div className="hero-sub">
                      <span className="bullish-label">Bullish Score:</span>
                      <span className="bullish-value">
                        {scorePercent === 'N/A' ? 'N/A' : `${scorePercent}`}
                      </span>
                    </div>
                  </div>

                  <div className="hero-right">
                    <div className="hero-sparkline">
                      <Sparklines data={closes} svgHeight={50} svgWidth={220}>
                        <SparklinesLine
                          color={lineColor}
                          style={{ strokeLinejoin: 'round', strokeLinecap: 'round' }}
                        />
                        <SparklinesSpots
                          size={2}
                          style={{ stroke: lineColor, strokeWidth: 1, fill: lineColor }}
                          spotColors={(index, value, points) => {
                            if (index === 0 || index === points.length - 1) return lineColor;
                            return 'transparent';
                          }}
                        />
                      </Sparklines>
                    </div>
                  </div>
                </div>
              );
            }}
          </TickerIndicatorsList>
        )}
      </TickerHistoryList>
    </div>
  );
}
