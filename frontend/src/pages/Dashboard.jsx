import './Dashboard.css';
import Header from '../components/Header';
import TickerCard from '../components/TickerCard';
import TodayBullishList from '../components/TodayBullishList';
import TickerHistoryList from '../components/TickerHistoryList';
import { useNavigate } from 'react-router-dom';
import IndicatorsChart from '../components/IndicatorsChart';

export default function Dashboard() {

  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <Header />

      {/* Section title */}
      <div className="section-title">Today Bullish Prediction</div>

      {/* Use your existing TodayBullishList.jsx as a render-prop */}
      <TodayBullishList>
        {({ data, loading, error }) => {
          if (loading) return <p>Loading bullish data...</p>;
          if (error) return <p>Error: {error}</p>;
          if (!data || data.length === 0) return <p>No bullish data</p>;

          // Top 5 tickers sorted by bullish_score
          const topTickers = [...data]
            .sort((a, b) => (b.bullish_score ?? 0) - (a.bullish_score ?? 0))
            .slice(0, 5);

          // All tickers alphabetically
          const allTickers = data.map((d) => d.ticker).sort();

          return (
            <>
              {/* Top 5 bullish tickers */}
              <section className="top-tickers-grid">
                {topTickers.map((t) => (
                  <TickerHistoryList key={t.ticker} ticker={t.ticker}>
                    {({ data: history = [], loading: histLoading }) => {
                      // get last 60 closes (safe even if history is shorter)
                      const closes = Array.isArray(history) ? history.slice(-60).map(d => d.close) : [];
                      return (
                        <TickerCard
                          ticker={t.ticker}
                          score={t.bullish_score}
                          trendData={!histLoading ? closes : []}
                        />
                      );
                    }}
                  </TickerHistoryList>
                ))}
              </section>


              {/* Bottom split section */}
              <section className="bottom-section">
                {topTickers[0] && (
                  <div className="card">
                    <TickerCard
                     className="bottom-card"
                      ticker={topTickers[0].ticker}
                      score={topTickers[0].bullish_score}
                    />
                    {/* Indicators chart below the ticker card */}
                    <div style={{ marginTop: '1.5rem' , height: '100px'}}>
                      <IndicatorsChart ticker={topTickers[0].ticker} />
                    </div>
                  </div>
                )}

                {/* Right: all tickers alphabetical list */}
                <div className="all-tickers">
                  <h2>All Tickers</h2>
                  <div className="ticker-columns">
                    <ul>
                      {allTickers.slice(0, 5).map((ticker) => (
                        <li key={ticker} onClick={() => navigate(`/ticker/${ticker}`)}>{ticker}</li>
                      ))}
                    </ul>
                    <ul>
                      {allTickers.slice(5, 10).map((ticker) => (
                        <li key={ticker} onClick={() => navigate(`/ticker/${ticker}`)}>{ticker}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className="show-more-btn"
                    onClick={() => navigate("/all-tickers", { state: { allTickers } })}
                  >
                    Show More
                  </button>
                </div>
              </section>
            </>
          );
        }}
      </TodayBullishList>
    </div>
  );
}
