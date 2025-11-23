import React, { useEffect, useRef } from 'react';

export default function TradingViewWidget({ symbol }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // clear previous widget if any
    container.innerHTML = '';

    // create the TradingView script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (!window.TradingView) return;

      new window.TradingView.widget({
        container_id: container.id,
        symbol: symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',           // candlestick
        locale: 'en',
        width: '100%',        // fill container width
        height: '100%',       // fill container height
        allow_symbol_change: true,
        hide_side_toolbar: false,
        show_popup_button: true,
      });
    };

    container.appendChild(script);

    return () => {
      // cleanup: remove all children on unmount
      if (container) container.innerHTML = '';
    };
  }, [symbol]);

  // parent container must have a fixed height for the chart to render fully
  return (
    <div
      ref={containerRef}
      id={`tradingview_${symbol}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
