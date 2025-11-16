# backend/routes/stocks.py
from fastapi import APIRouter, HTTPException
from app.services.stock_fetcher import fetch_stock_data

router = APIRouter()

@router.get("/fetch/{ticker}")
async def get_stock_data(ticker: str, start: str = None, end: str = None):
    """
    Fetch stock data for a ticker and return as JSON.
    Returns first 5 rows as preview.
    """
    df = fetch_stock_data(ticker, start=start, end=end)
    
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {ticker}")
    
    # Convert to list of dicts (JSON-serializable)
    preview = df.head(5).to_dict(orient="records")
    
    return {
        "ticker": ticker.upper(),
        "rows": len(df),
        "preview": preview
    }

