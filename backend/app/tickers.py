# backend/app/tickers.py
from fastapi import APIRouter
import sys
import os

# add backend root to path so we can import the script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from save_tickers_to_parquet_single import TICKERS  # import TICKERS from the backend root script

router = APIRouter(prefix="/tickers", tags=["tickers"])

@router.get("/")
def get_all_tickers():
    """
    Return the list of all tickers we have parquet data for.
    """
    return {"tickers": TICKERS}
