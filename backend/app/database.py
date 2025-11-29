# backend/app/database.py

from sqlmodel import SQLModel, Field, create_engine, Session
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
# Helper functions
# -------------------------
def create_db_and_tables():
    """Create all tables in the database."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Yield a SQLModel session."""
    with Session(engine) as session:
        yield session
