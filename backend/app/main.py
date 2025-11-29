# backend/main.py
from fastapi import FastAPI,HTTPException
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routes import stocks  
import numpy as np
from app.auth import router as auth_router

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
TODAY_FILE = os.path.join(BASE_DIR, "today_bullish_scores", "parquet", "today_bullish_scores.parquet")
TICKER_DATA_DIR = os.path.join(BASE_DIR, "data", "parquet")  
TICKER_INDICATORS_DIR = os.path.join(BASE_DIR, "indicators", "parquet")  



app = FastAPI(title="Stock Search API")


app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
app.include_router(auth_router) 

# CORS for Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

def df_to_json_records_safe(df):
    """
    Converts a DataFrame into JSON-safe records:
    - Replaces inf/-inf with NaN
    - Converts NaN to None
    - Converts numpy scalars into native Python types
    """

    df = df.replace([np.inf, -np.inf], np.nan)

    records = []
    for row in df.to_dict(orient="records"):
        clean_row = {}
        for k, v in row.items():

            # Convert numpy scalar → Python scalar
            if isinstance(v, (np.generic,)):
                v = v.item()

            # Replace NaN/inf with None
            if isinstance(v, float):
                if np.isnan(v) or np.isinf(v):
                    clean_row[k] = None
                    continue

            clean_row[k] = v

        records.append(clean_row)

    return records


# ---------- Endpoints


@app.get("/api/today_bullish")
def get_today_bullish():

     # Debug
    print("Looking for:", TODAY_FILE)
    print("Exists?", os.path.exists(TODAY_FILE))
    
    try:
        df = pd.read_parquet(TODAY_FILE)
        df['timestamp'] = df['timestamp'].astype(str)
        return df_to_json_records_safe(df)
    except FileNotFoundError:
        return {"error": "Bullish score file not found"}
    
@app.get("/api/ticker_history/{ticker}")
def get_ticker_history(ticker: str):
    file_path = os.path.join(TICKER_DATA_DIR, f"{ticker}.parquet")
    
    # Debug 
    print("Looking for ticker file:", file_path)
    print("Exists?", os.path.exists(file_path))
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ticker data not found")

    try:
        df = pd.read_parquet(file_path).sort_values("timestamp")
        df['timestamp'] = df['timestamp'].astype(str)
        # return full dataframe
        return df_to_json_records_safe(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/ticker_indicators/{ticker}")
def get_ticker_indicators(ticker: str):
    # Constructs the path to the ticker's indicators parquet
    file_path = os.path.join(TICKER_INDICATORS_DIR, f"{ticker}.parquet")

    # Debug 
    print("Looking for indicators file:", file_path)
    print("Exists?", os.path.exists(file_path))

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Ticker indicators not found")

    try:
        df = pd.read_parquet(file_path).sort_values("timestamp")
        df['timestamp'] = df['timestamp'].astype(str)
        return df_to_json_records_safe(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))