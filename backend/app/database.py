# backend/app/database.py

from sqlmodel import SQLModel, Field,select, create_engine, Session
from datetime import datetime
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

# Engine
engine = create_engine(DATABASE_URL, echo=True)

# -------------------------
# Models
# -------------------------
class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# -------------------------
# WALLET MODELS
# -------------------------
class Wallet(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)
    cash_cents: int = Field(default=1_000_000)  # starting balance $10,000
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Holding(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    wallet_id: int = Field(foreign_key="wallet.id", index=True)
    ticker: str = Field(index=True)
    quantity: float = Field(default=0)

class Transaction(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    wallet_id: int = Field(foreign_key="wallet.id", index=True)
    type: str  # "BUY" or "SELL"
    ticker: str
    price_cents: int
    quantity: float
    total_cents: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

# -------------------------
# HELPER FUNCTIONS
# -------------------------
def create_db_and_tables():
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yield a SQLModel session."""
    with Session(engine) as session:
        yield session

def ensure_wallet_for_user(session: Session, user_id: int) -> Wallet:
    """
    Ensure a wallet exists for a given user.
    If not, create one with initial balance.
    """
    wallet = session.exec(
        select(Wallet).where(Wallet.user_id == user_id)
    ).one_or_none()

    if wallet:
        return wallet

    wallet = Wallet(user_id=user_id)
    session.add(wallet)
    session.commit()
    session.refresh(wallet)
    return wallet
