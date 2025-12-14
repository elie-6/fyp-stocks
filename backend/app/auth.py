# backend/app/auth.py
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import select
from app.database import get_session, User
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os

# -------------------------
# Config
# -------------------------
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET not found in .env file")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# -------------------------
# Pydantic Schemas
# -------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# -------------------------
# Helpers
# -------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])  # truncate to 72 chars max

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password[:72], hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(session, email: str):
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    with next(get_session()) as session:
        user = session.get(User, int(user_id))
        if not user:
            raise credentials_exception
        return user


# -------------------------
# Helper to get user ID directly
# -------------------------
def get_current_user_id(current_user: User = Depends(get_current_user)) -> int:
    """
    FastAPI dependency to return only the user ID from the current token.
    Can be used in routes that only need user_id, e.g., wallet endpoints.
    """
    return current_user.id

# -------------------------
# Routes
# -------------------------
@router.post("/signup", response_model=TokenResponse)
def signup(req: SignupRequest, session=Depends(get_session)):
    if get_user_by_email(session, req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email, password_hash=hash_password(req.password))
    session.add(user)
    session.commit()
    session.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, session=Depends(get_session)):
    user = get_user_by_email(session, req.email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me")
def read_profile(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "id": current_user.id}