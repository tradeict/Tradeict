from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import uuid
import os
import logging
from pathlib import Path
from enum import Enum
import pandas as pd
import io
import requests
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Trading Simulation API")
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Enums
class StrategyType(str, Enum):
    RISKY = "risky"
    GUARANTEED = "guaranteed"

class TransactionType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    PROFIT = "profit"
    LOSS = "loss"
    DEPOSIT = "deposit"
    COUPON_REDEMPTION = "coupon_redemption"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: Optional[str] = None  # None for OAuth users
    role: UserRole = UserRole.USER
    virtual_balance: float = 10000.0  # Starting virtual money
    earnings_balance: float = 0.0     # Profits from trading
    google_id: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Strategy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    strategy_type: StrategyType
    monthly_returns: float  # Percentage
    capital_required: float
    logic_description: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StrategyCreate(BaseModel):
    name: str
    description: str
    strategy_type: StrategyType
    monthly_returns: float
    capital_required: float
    logic_description: str

class UserStrategy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    strategy_id: str
    invested_amount: float
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    total_profit_loss: float = 0.0

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    strategy_id: Optional[str] = None
    transaction_type: TransactionType
    amount: float
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    trade_details: Optional[Dict[str, Any]] = None

class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    points_required: float  # Points needed to redeem
    value: float  # Actual value of the coupon
    is_active: bool = True
    expiry_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CouponCreate(BaseModel):
    title: str
    description: str
    points_required: float
    value: float
    expiry_date: Optional[datetime] = None

class CouponRedemption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    coupon_id: str
    points_used: float
    redemption_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    strategy_id: str
    user_name: str
    user_email: EmailStr
    phone_number: Optional[str] = None
    message: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionRequestCreate(BaseModel):
    strategy_id: str
    user_name: str
    user_email: EmailStr
    phone_number: Optional[str] = None
    message: Optional[str] = None

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    # First try to get session_token from cookies
    session_token = request.cookies.get("session_token")
    token = None
    
    if session_token:
        # Check session in database
        session = await db.sessions.find_one({"session_token": session_token})
        if session and session["expires_at"] > datetime.now(timezone.utc):
            user = await db.users.find_one({"id": session["user_id"]})
            if user:
                return User(**user)
    
    # Fallback to JWT token from Authorization header
    if credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "virtual_balance": user.virtual_balance,
            "earnings_balance": user.earnings_balance
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "virtual_balance": user["virtual_balance"],
            "earnings_balance": user["earnings_balance"]
        }
    }

@api_router.get("/auth/session-data")
async def get_session_data(request: Request):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth service
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = response.json()
        
        # Check if user exists in our database
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user from Google OAuth
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                google_id=user_data["id"],
                profile_picture=user_data.get("picture"),
                password_hash=None
            )
            await db.users.insert_one(user.dict())
        
        # Create session in our database
        session_token = user_data["session_token"]
        session = Session(
            user_id=user.id,
            session_token=session_token,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        
        await db.sessions.insert_one(session.dict())
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "virtual_balance": user.virtual_balance,
                "earnings_balance": user.earnings_balance,
                "profile_picture": user.profile_picture
            },
            "session_token": session_token
        }
        
    except requests.RequestException:
        raise HTTPException(status_code=500, detail="Authentication service unavailable")

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

# Strategy Routes
@api_router.get("/strategies", response_model=List[Strategy])
async def get_strategies(current_user: User = Depends(get_current_user)):
    strategies = await db.strategies.find({"is_active": True}).to_list(1000)
    return [Strategy(**strategy) for strategy in strategies]

@api_router.post("/strategies", response_model=Strategy)
async def create_strategy(strategy_data: StrategyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    strategy = Strategy(**strategy_data.dict())
    await db.strategies.insert_one(strategy.dict())
    return strategy

@api_router.get("/strategies/{strategy_id}", response_model=Strategy)
async def get_strategy(strategy_id: str, current_user: User = Depends(get_current_user)):
    strategy = await db.strategies.find_one({"id": strategy_id, "is_active": True})
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return Strategy(**strategy)

# User Strategy Routes
@api_router.post("/user-strategies")
async def invest_in_strategy(strategy_id: str = Form(...), amount: float = Form(...), current_user: User = Depends(get_current_user)):
    strategy = await db.strategies.find_one({"id": strategy_id, "is_active": True})
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    if amount < strategy["capital_required"]:
        raise HTTPException(status_code=400, detail="Investment amount below minimum required")
    
    if current_user.virtual_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create user strategy
    user_strategy = UserStrategy(
        user_id=current_user.id,
        strategy_id=strategy_id,
        invested_amount=amount
    )
    
    await db.user_strategies.insert_one(user_strategy.dict())
    
    # Update user balance
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"virtual_balance": -amount}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        strategy_id=strategy_id,
        transaction_type=TransactionType.BUY,
        amount=amount,
        description=f"Investment in {strategy['name']}"
    )
    
    await db.transactions.insert_one(transaction.dict())
    
    return {"message": "Investment successful", "user_strategy_id": user_strategy.id}

@api_router.get("/user-strategies")
async def get_user_strategies(current_user: User = Depends(get_current_user)):
    user_strategies = await db.user_strategies.find(
        {"user_id": current_user.id, "is_active": True},
        {"_id": 0}  # Exclude MongoDB _id field
    ).to_list(1000)
    
    # Populate strategy details
    result = []
    for us in user_strategies:
        strategy = await db.strategies.find_one(
            {"id": us["strategy_id"]},
            {"_id": 0}  # Exclude MongoDB _id field
        )
        if strategy:
            result.append({
                **us,
                "strategy_name": strategy["name"],
                "strategy_type": strategy["strategy_type"],
                "monthly_returns": strategy["monthly_returns"]
            })
    
    return result

# Wallet Routes
@api_router.get("/wallet")
async def get_wallet(current_user: User = Depends(get_current_user)):
    return {
        "virtual_balance": current_user.virtual_balance,
        "earnings_balance": current_user.earnings_balance,
        "total_balance": current_user.virtual_balance + current_user.earnings_balance
    }

@api_router.get("/transactions")
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {"user_id": current_user.id},
        {"_id": 0}  # Exclude MongoDB _id field
    ).sort("created_at", -1).to_list(1000)
    return transactions

# Coupon Routes
@api_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(current_user: User = Depends(get_current_user)):
    coupons = await db.coupons.find({"is_active": True}).to_list(1000)
    return [Coupon(**coupon) for coupon in coupons]

@api_router.post("/coupons/redeem")
async def redeem_coupon(coupon_id: str = Form(...), current_user: User = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"id": coupon_id, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    if current_user.earnings_balance < coupon["points_required"]:
        raise HTTPException(status_code=400, detail="Insufficient earnings balance")
    
    # Check if coupon is expired
    if coupon.get("expiry_date"):
        expiry_date = coupon["expiry_date"]
        # Handle both string and datetime objects
        if isinstance(expiry_date, str):
            expiry_date = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        # Ensure timezone awareness
        if expiry_date.tzinfo is None:
            expiry_date = expiry_date.replace(tzinfo=timezone.utc)
        if expiry_date < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Create redemption record
    redemption = CouponRedemption(
        user_id=current_user.id,
        coupon_id=coupon_id,
        points_used=coupon["points_required"]
    )
    
    await db.coupon_redemptions.insert_one(redemption.dict())
    
    # Update user earnings balance
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"earnings_balance": -coupon["points_required"]}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user.id,
        transaction_type=TransactionType.COUPON_REDEMPTION,
        amount=-coupon["points_required"],
        description=f"Redeemed coupon: {coupon['title']}"
    )
    
    await db.transactions.insert_one(transaction.dict())
    
    return {"message": "Coupon redeemed successfully", "redemption_id": redemption.id}

# Subscription Request Routes
@api_router.post("/subscription-requests")
async def create_subscription_request(request_data: SubscriptionRequestCreate, current_user: User = Depends(get_current_user)):
    strategy = await db.strategies.find_one({"id": request_data.strategy_id, "is_active": True})
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    
    subscription_request = SubscriptionRequest(
        user_id=current_user.id,
        **request_data.dict()
    )
    
    await db.subscription_requests.insert_one(subscription_request.dict())
    
    return {"message": "Subscription request submitted successfully", "request_id": subscription_request.id}

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)  # Exclude MongoDB _id field
    return users

@api_router.get("/admin/subscription-requests")
async def get_subscription_requests(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    requests = await db.subscription_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Populate user and strategy details
    result = []
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0})
        strategy = await db.strategies.find_one({"id": req["strategy_id"]}, {"_id": 0})
        
        result.append({
            **req,
            "user_name": user["name"] if user else "Unknown",
            "strategy_name": strategy["name"] if strategy else "Unknown"
        })
    
    return result

@api_router.post("/admin/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    coupon = Coupon(**coupon_data.dict())
    await db.coupons.insert_one(coupon.dict())
    return coupon

@api_router.post("/admin/upload-trading-results")
async def upload_trading_results(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Expected columns: Date, TransactionType, StrategyName, TradeDetails, ProfitLossPercentage
        required_columns = ['Date', 'TransactionType', 'StrategyName', 'TradeDetails', 'ProfitLossPercentage']
        
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns: {required_columns}")
        
        processed_count = 0
        
        for _, row in df.iterrows():
            # Find strategy
            strategy = await db.strategies.find_one({"name": row['StrategyName']})
            if not strategy:
                continue
            
            # Find all active user strategies for this strategy
            user_strategies = await db.user_strategies.find({
                "strategy_id": strategy["id"],
                "is_active": True
            }).to_list(1000)
            
            for user_strategy in user_strategies:
                # Calculate profit/loss amount
                profit_loss_amount = user_strategy["invested_amount"] * (row['ProfitLossPercentage'] / 100)
                
                # Update user strategy total
                await db.user_strategies.update_one(
                    {"id": user_strategy["id"]},
                    {"$inc": {"total_profit_loss": profit_loss_amount}}
                )
                
                # Update user earnings balance
                await db.users.update_one(
                    {"id": user_strategy["user_id"]},
                    {"$inc": {"earnings_balance": profit_loss_amount}}
                )
                
                # Create transaction record
                transaction = Transaction(
                    user_id=user_strategy["user_id"],
                    strategy_id=strategy["id"],
                    transaction_type=TransactionType.PROFIT if profit_loss_amount >= 0 else TransactionType.LOSS,
                    amount=profit_loss_amount,
                    description=f"Trading result: {row['TradeDetails']}",
                    trade_details={
                        "date": row['Date'],
                        "transaction_type": row['TransactionType'],
                        "profit_loss_percentage": row['ProfitLossPercentage'],
                        "trade_details": row['TradeDetails']
                    }
                )
                
                await db.transactions.insert_one(transaction.dict())
                processed_count += 1
        
        return {"message": f"Trading results processed successfully. {processed_count} records updated."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)