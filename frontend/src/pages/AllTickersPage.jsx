import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import TickerHistoryList from "../components/TickerHistoryList";
import "../index.css";
import { Sparklines, SparklinesLine, SparklinesSpots } from "react-sparklines";

export default function AllTickersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const allTickers = location.state?.allTickers || [];

  return (
    <div className="all-tickers-page">
      <Header />
      <h2 className="section-title">All Tickers</h2>

      <div className="all-tickers-container">
        {allTickers.map((ticker) => (
          <TickerHistoryList key={ticker} ticker={ticker}>
            {({ data, loading, error }) => {
              if (loading) return <p>Loading {ticker}...</p>;
              if (error) return <p>Error loading {ticker}</p>;
              if (!data.length) return null;

              const lastClose = data[data.length - 1].close;
              const lastVolume = data[data.length - 1].volume;
              const trendData = data.slice(-60).map((d) => d.close); // last 60 closes

              // determine line color based on last vs 7 periods ago
              let lineColor = "gray";
              if (trendData.length >= 8) {
                const last = trendData[trendData.length - 1];
                const last7 = trendData[trendData.length - 8];
                lineColor = last > last7 ? "lime" : last < last7 ? "red" : "gray";
              }

              return (
                <div
                  className="full-width-ticker-card"
                  onClick={() => navigate(`/ticker/${ticker}`)}
                >
                  {/* LEFT — ticker name */}
                  <div className="ticker-card-left">
                    <h3>{ticker}</h3>
                  </div>

                  {/* MIDDLE — close & volume (right-aligned) */}
                  <div className="ticker-card-middle">
                    <p className="ticker-close">Close: ${lastClose.toFixed(2)}</p>
                    <p className="ticker-vol">Volume: {lastVolume.toLocaleString()}</p>
                  </div>

                  {/* RIGHT — sparkline */}
                  <div className="ticker-card-right">
                    <Sparklines data={trendData} svgWidth={200} svgHeight={40}>
                      <SparklinesLine
                        color={lineColor}
                        style={{ strokeLinejoin: "round", strokeLinecap: "round" }}
                      />
                      <SparklinesSpots
                        size={2}
                        style={{ stroke: lineColor, strokeWidth: 1, fill: lineColor }}
                        spotColors={(index, value, points) => {
                          if (index === 0 || index === points.length - 1) return lineColor;
                          return "transparent";
                        }}
                      />
                    </Sparklines>
                  </div>
                </div>
              );
            }}
          </TickerHistoryList>
        ))}
      </div>
    </div>
  );
}
