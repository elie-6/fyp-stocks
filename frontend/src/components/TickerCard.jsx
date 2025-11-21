import { useNavigate } from 'react-router-dom';
import './TickerCard.css';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

export default function TickerCard({ ticker, score, trendData }) {
  const navigate = useNavigate();

  // Determine color based on last price vs 7 days ago
  let lineColor = 'gray';
  if (Array.isArray(trendData) && trendData.length > 7) {
    const last = trendData[trendData.length - 1];
    const last7 = trendData[trendData.length - 8];
    lineColor = last > last7 ? 'lime' : last < last7 ? 'red' : 'gray';
  }

  return (
    <div
      className="card cursor-pointer"
      onClick={() => navigate(`/ticker/${ticker}`)}
    >
      <h2>{ticker}</h2>
      <p>Bullish Score: {(score * 100)?.toFixed(2) ?? 'N/A'}</p>

      {trendData && trendData.length > 0 && (
        <div className="sparkline-wrapper">
          <Sparklines data={trendData} svgWidth={200} svgHeight={40}>
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
      )}

    </div>
  );
}
