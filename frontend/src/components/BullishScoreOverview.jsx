// src/components/BullishScoreOverview.jsx
import React from 'react';
import TickerIndicatorsList from './TickerIndicatorsList';
import BullishScoreChart from './BullishScoreChart';

export default function BullishScoreOverview({ ticker }) {
  const width = 300;           // total SVG width
  const height = 180;          // semi-circle height
  const strokeWidth = 24;      // arc thickness
  const radius = width / 2 - strokeWidth; 
  const centerX = width / 2;
  const centerY = height;

  return (
    <TickerIndicatorsList ticker={ticker}>
      {({ data = [], loading, error }) => {
        if (loading) return <p>Loading Bullish Score...</p>;
        if (error) return <p>Error: {error}</p>;
        if (!data.length) return <p>No Bullish Score data</p>;

        const latest = data[data.length - 1]?.bullish_score ?? 0;
        const angle = latest * Math.PI; // 0–180°

        // Shorten needle further so it doesn't overlap arc
        const needleLength = radius - strokeWidth / 2; // slightly shorter
        const needleTipX = centerX + needleLength * Math.cos(Math.PI - angle);
        const needleTipY = centerY - needleLength * Math.sin(Math.PI - angle);

        // pointy needle base
        const tipSize = 6;
        const needleBaseLeftX = centerX - tipSize * Math.sin(angle);
        const needleBaseLeftY = centerY - tipSize * Math.cos(angle);
        const needleBaseRightX = centerX + tipSize * Math.sin(angle);
        const needleBaseRightY = centerY + tipSize * Math.cos(angle);

        // Match score color to its value
        let scoreColor = '#f87171';
        if (latest >= 0.5 && latest < 0.75) scoreColor = '#facc15';
        else if (latest >= 0.75) scoreColor = '#4ade80';

        return (
          <section style={{
            marginTop: 16,
            padding: '1rem',
            background: 'linear-gradient(145deg,#0f1317,#0c0f12)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.03)',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: 16 ,  fontSize: '1.8rem', fontWeight: '700' }}>Bullish Score Overview</h3>

            {/* Score above the gauge */}
            <div style={{ fontSize: 32, fontWeight: 'bold', color: scoreColor, marginBottom: 12 }}>
              {(latest * 100).toFixed(2)}%
            </div>

            {/* Gauge */}
            <svg width={width} height={height + 30}>
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>

              <path
                d={`
                  M ${centerX - radius},${centerY}
                  A ${radius},${radius} 0 0 1 ${centerX + radius},${centerY}
                `}
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Needle */}
              <polygon
                points={`
                  ${needleTipX},${needleTipY} 
                  ${needleBaseLeftX},${needleBaseLeftY} 
                  ${needleBaseRightX},${needleBaseRightY}
                `}
                fill="#fff"
              />
              <circle cx={centerX} cy={centerY} r={6} fill="#fff" />

              {/* Labels */}
              <text x={centerX - radius} y={centerY + 25} fontSize={14} fill="#B0B8C1" textAnchor="middle">0%</text>
              <text x={centerX + radius} y={centerY + 25} fontSize={14} fill="#B0B8C1" textAnchor="middle">100%</text>
            </svg>

            {/* Last 30 bullish scores chart */}
            <BullishScoreChart ticker={ticker} />
          </section>
        );
      }}
    </TickerIndicatorsList>
  );
}
