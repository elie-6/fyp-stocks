// src/components/IndicatorsChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TickerIndicatorsList from './TickerIndicatorsList';

export default function IndicatorsChart({ ticker }) {
  if (!ticker) return <p>No ticker provided</p>;

  // Map data keys to display names & colors
  const indicatorsMap = [
    { key: 'RSI14_norm', label: 'RSI14', color: '#4ade80' },
    { key: 'EMA50_dist_norm', label: 'EMA50', color: '#3B82F6' },
    { key: 'ROC_10_norm', label: 'ROC10', color: '#facc15' },
  ];

  return (
    <TickerIndicatorsList ticker={ticker}>
      {({ data, loading, error }) => {
        if (loading) return <p>Loading indicators...</p>;
        if (error) return <p>Error: {error}</p>;
        if (!data || !data.length) return <p>No indicator data</p>;

        // Preprocess chart data: convert initial 0s to null to prevent jump, then scale to 0–100
        const chartData = data.map((row) => {
          const newRow = { date: row.date };
          indicatorsMap.forEach((ind) => {
            const val = row[ind.key];
            newRow[ind.key] = val === 0 ? null : val; // keep 0 → null
          });
          return newRow;
        });

        // Scale non-null values to 0–100 and leave initial nulls intact
        indicatorsMap.forEach((ind) => {
          chartData.forEach((row) => {
            if (row[ind.key] !== null) {
              row[ind.key] = +(row[ind.key] * 100).toFixed(2);
            }
          });
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {indicatorsMap.map((ind) => (
                <Line
                  key={ind.key}
                  dataKey={ind.key}
                  name={ind.label} // clean label in legend
                  stroke={ind.color}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                  connectNulls={false} // do not connect nulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }}
    </TickerIndicatorsList>
  );
}
