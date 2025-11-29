# backend/test_db.py

from app.database import create_db_and_tables, get_session, User
from passlib.context import CryptContext

# -------------------------
# Setup password hashing
# -------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------------------------
# Step 1: Create tables
# -------------------------
create_db_and_tables()
print("Tables created successfullybeu")

# -------------------------
# Step 2: Create a test user
# -------------------------
test_email = "test@example.com"
test_password = "123456"  # any password for testing
test_password = test_password[:72]  # truncate to 72 chars max for bcrypt
hashed_password = pwd_context.hash(test_password)

# -------------------------
# Step 3: Insert the user into DB
# -------------------------
with next(get_session()) as session:
    user = User(email=test_email, password_hash=hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"Test user created: {user.email}, id: {user.id}")
