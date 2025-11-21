import './Dashboard.css';
import Header from '../components/Header';
import TickerCard from '../components/TickerCard';
import TodayBullishList from '../components/TodayBullishList';
import TickerHistoryList from '../components/TickerHistoryList';

export default function Dashboard() {
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
                {/* Left: best bullish ticker */}
                {topTickers[0] && (
                  <TickerCard ticker={topTickers[0].ticker} score={topTickers[0].bullish_score} />
                )}

                {/* Right: all tickers alphabetical list */}
                <div className="all-tickers">
                  <h2>All Tickers</h2>
                  <ul>
                    {allTickers.map((ticker) => (
                      <li key={ticker}>{ticker}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </>
          );
        }}
      </TodayBullishList>
    </div>
  );
}
