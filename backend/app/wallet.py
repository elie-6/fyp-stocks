# backend/app/wallet.py

from decimal import Decimal, ROUND_HALF_UP, getcontext
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import Wallet, Holding, Transaction, ensure_wallet_for_user, get_session
from app.auth import get_current_user_id  # your auth dependency
from pydantic import BaseModel

# -------------------------
# DECIMAL / UTILS
# -------------------------
getcontext().prec = 28  # high precision for fractional shares

def decimal_to_cents(d: Decimal) -> int:
    """
    Convert Decimal dollars to integer cents, rounding half-up.
    """
    cents = (d * Decimal(100)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    return int(cents)

def cents_times_quantity(price_cents: int, quantity: Decimal) -> int:
    """
    Multiply integer price_cents by Decimal quantity, rounding to nearest cent.
    """
    total = (Decimal(price_cents) * quantity).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    return int(total)

# -------------------------
# LIVE PRICE HELPER
# -------------------------
import yfinance as yf

def get_live_price(ticker: str) -> Decimal:
    """
    Fetch the latest market price for a ticker using yfinance.
    Returns Decimal for precision.
    """
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period="1d")
        if data.empty:
            raise ValueError(f"No price data for {ticker}")
        last_close = data['Close'].iloc[-1]
        return Decimal(str(last_close))
    except Exception as e:
        raise ValueError(f"Failed to fetch price for {ticker}: {e}")

# -------------------------
# CORE WALLET OPERATIONS
# -------------------------
def buy(session: Session, user_id: int, ticker: str, quantity: Decimal, price: Decimal) -> dict:
    if quantity <= 0 or price <= 0:
        raise ValueError("Quantity and price must be > 0")

    price_cents = decimal_to_cents(price)
    total_cents = cents_times_quantity(price_cents, quantity)

    wallet = ensure_wallet_for_user(session, user_id)

    stmt = select(Wallet).where(Wallet.id == wallet.id).with_for_update()
    locked_wallet = session.exec(stmt).one()

    if locked_wallet.cash_cents < total_cents:
        raise Exception("Insufficient cash to complete buy")

    locked_wallet.cash_cents = int(Decimal(locked_wallet.cash_cents) - Decimal(total_cents))
    locked_wallet.updated_at = datetime.utcnow()
    session.add(locked_wallet)
    session.flush()

    h_stmt = select(Holding).where(Holding.wallet_id == locked_wallet.id, Holding.ticker == ticker)
    holding = session.exec(h_stmt).one_or_none()
    if holding:
        holding.quantity = Decimal(holding.quantity) + quantity
        session.add(holding)
    else:
        holding = Holding(wallet_id=locked_wallet.id, ticker=ticker, quantity=quantity)
        session.add(holding)

    tx = Transaction(
        wallet_id=locked_wallet.id,
        type="BUY",
        ticker=ticker,
        price_cents=price_cents,
        quantity=quantity,
        total_cents=total_cents,
        created_at=datetime.utcnow()
    )
    session.add(tx)
    session.flush()

    return {
        "wallet_id": locked_wallet.id,
        "cash_cents": int(locked_wallet.cash_cents),
        "tx_id": tx.id,
        "tx": {
            "type": "BUY",
            "ticker": ticker,
            "price_cents": price_cents,
            "quantity": float(quantity),
            "total_cents": total_cents,
        }
    }

def sell(session: Session, user_id: int, ticker: str, quantity: Decimal, price: Decimal) -> dict:
    if quantity <= 0 or price <= 0:
        raise ValueError("Quantity and price must be > 0")

    price_cents = decimal_to_cents(price)
    total_cents = cents_times_quantity(price_cents, quantity)

    wallet = ensure_wallet_for_user(session, user_id)

    stmt = select(Wallet).where(Wallet.id == wallet.id).with_for_update()
    locked_wallet = session.exec(stmt).one()

    h_stmt = select(Holding).where(Holding.wallet_id == locked_wallet.id, Holding.ticker == ticker).with_for_update()
    holding = session.exec(h_stmt).one_or_none()

    if not holding or Decimal(holding.quantity) < quantity:
        raise Exception("Insufficient holdings to sell")

    new_qty = Decimal(holding.quantity) - quantity
    if new_qty <= 0:
        session.delete(holding)
    else:
        holding.quantity = new_qty
        session.add(holding)

    locked_wallet.cash_cents = int(Decimal(locked_wallet.cash_cents) + Decimal(total_cents))
    locked_wallet.updated_at = datetime.utcnow()
    session.add(locked_wallet)

    tx = Transaction(
        wallet_id=locked_wallet.id,
        type="SELL",
        ticker=ticker,
        price_cents=price_cents,
        quantity=quantity,
        total_cents=total_cents,
        created_at=datetime.utcnow()
    )
    session.add(tx)
    session.flush()

    return {
        "wallet_id": locked_wallet.id,
        "cash_cents": int(locked_wallet.cash_cents),
        "tx_id": tx.id,
        "tx": {
            "type": "SELL",
            "ticker": ticker,
            "price_cents": price_cents,
            "quantity": float(quantity),
            "total_cents": total_cents,
        }
    }

# -------------------------
# FASTAPI ROUTES
# -------------------------
router = APIRouter(prefix="/wallet", tags=["wallet"])

class TradeIn(BaseModel):
    ticker: str
    quantity: str  # string to preserve decimal precision

@router.post("/buy")
def route_buy(payload: TradeIn, session: Session = Depends(get_session), user_id: int = Depends(get_current_user_id)):
    try:
        quantity = Decimal(payload.quantity)
        price = get_live_price(payload.ticker)  # live price fetch
        with session.begin():
            res = buy(session, user_id, payload.ticker, quantity, price)
        return {"ok": True, "result": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sell")
def route_sell(payload: TradeIn, session: Session = Depends(get_session), user_id: int = Depends(get_current_user_id)):
    try:
        quantity = Decimal(payload.quantity)
        price = get_live_price(payload.ticker)  # live price fetch
        with session.begin():
            res = sell(session, user_id, payload.ticker, quantity, price)
        return {"ok": True, "result": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/value")
def get_wallet_value(session: Session = Depends(get_session), user_id: int = Depends(get_current_user_id)):
    """
    Returns the current wallet value including cash + current value of all holdings.
    """

    wallet = ensure_wallet_for_user(session, user_id)
    holdings = session.exec(select(Holding).where(Holding.wallet_id == wallet.id)).all()

    # compute cash in dollars (Decimal)
    cash_decimal = (Decimal(wallet.cash_cents) / Decimal(100)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # compute holdings' total value (Decimal) and build result list
    total_holdings_value = Decimal("0")
    result_holdings = []

    for h in holdings:
        price = get_live_price(h.ticker)
        qty = Decimal(h.quantity)
        holding_value = (qty * price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_holdings_value += holding_value

        result_holdings.append({
            "ticker": h.ticker,
            "quantity": float(qty),
            "current_price": float(price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
            "holding_value": float(holding_value)
        })

    # total_value is cash + holdings value
    total_value_decimal = (cash_decimal + total_holdings_value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        # keep the original field names (cash, total_value) but fixed:
        "cash": float(cash_decimal),
        "total_value": float(total_value_decimal),
        "holdings": result_holdings
    }

@router.get("/live_price/{ticker}")
def live_price(ticker: str):
    try:
        price = get_live_price(ticker)
        return {"ticker": ticker, "price": float(price)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
