import { useNavigate } from 'react-router-dom';
import './TickerCard.css';

export default function TickerCard({ ticker, score, trendData }) {
  const navigate = useNavigate();

  return (
    <div
      className="card cursor-pointer"
      onClick={() => navigate(`/ticker/${ticker}`)}
    >
      <h2>{ticker}</h2>
      <p>Bullish Score: {(score * 100)?.toFixed(2) ?? 'N/A'}</p>

      {trendData && trendData.length > 0 && (
        <div className="trend-placeholder">Trend Sparkline</div>
      )}
    </div>
  );
}
