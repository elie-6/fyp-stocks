# backend/main.py
from fastapi import FastAPI
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routes import stocks  # your existing router

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
TODAY_FILE = os.path.join(BASE_DIR, "today_bullish_scores", "parquet", "today_bullish_scores.parquet")


app = FastAPI(title="Stock Search API")

# Include your existing stocks router
app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])

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

# ---------- New endpoint for today bullish scores ----------


@app.get("/api/today_bullish")
def get_today_bullish():

     # Debug: check path
    print("Looking for:", TODAY_FILE)
    print("Exists?", os.path.exists(TODAY_FILE))
    
    try:
        df = pd.read_parquet(TODAY_FILE)
        df['timestamp'] = df['timestamp'].astype(str)
        return df.to_dict(orient="records")
    except FileNotFoundError:
        return {"error": "Bullish score file not found"}
