
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import TickerIndicatorsList from './TickerIndicatorsList';

export default function BullishScoreChart({ ticker }) {
  if (!ticker) return <p>No ticker provided</p>;

  return (
    <TickerIndicatorsList ticker={ticker}>
      {({ data = [], loading, error }) => {
        if (loading) return <p>Loading Bullish Score Chart...</p>;
        if (error) return <p>Error: {error}</p>;
        if (!data.length) return <p>No Bullish Score data</p>;

        // Take last 30 rows
        const chartData = data.slice(-30).map((row) => ({
          date: row.date || (row.timestamp ? new Date(Number(row.timestamp)).toISOString().slice(0, 10) : ''),
          score: +(row.bullish_score * 100).toFixed(2),
        }));

        return (
          <section style={{ marginTop: 32, padding: '1rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16, color: '#B0B8C1' }}>Last 30 Days Bullish Scores</h3>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" />
                  <XAxis dataKey="date" tick={{ fill: '#B0B8C1', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#B0B8C1', fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#4ade80"
                    strokeWidth={2.5}
                    fill="url(#bullishGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        );
      }}
    </TickerIndicatorsList>
  );
}
