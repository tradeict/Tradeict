#!/usr/bin/env python3
import asyncio
import sys
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import uuid

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_database():
    print("Initializing Tradeict database with sample data...")
    
    # Create admin user (original)
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@tradingsim.com",
        "name": "Admin User",
        "phone_number": "+1234567890",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "virtual_balance": 50000.0,
        "earnings_balance": 5000.0,
        "task_balance": 0.0,
        "total_investment": 0.0,
        "google_id": None,
        "profile_picture": None,
        "is_active": True,
        "email_verified": True,
        "last_daily_login": None,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }
    
    # Create specific admin user requested by user
    bimal_admin_user = {
        "id": str(uuid.uuid4()),
        "email": "bimal.vishvakarma@gmail.com",
        "name": "Bimal Vishvakarma",
        "phone_number": "+1234567890",
        "password_hash": pwd_context.hash("Admin@123"),
        "role": "admin",
        "virtual_balance": 100000.0,
        "earnings_balance": 10000.0,
        "task_balance": 0.0,
        "total_investment": 0.0,
        "google_id": None,
        "profile_picture": None,
        "is_active": True,
        "email_verified": True,
        "last_daily_login": None,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }
    
    # Check if admin users already exist
    existing_admin = await db.users.find_one({"email": "admin@tradingsim.com"})
    if not existing_admin:
        await db.users.insert_one(admin_user)
        print("✓ Created admin user (admin@tradingsim.com / admin123)")
    else:
        print("✓ Admin user already exists")
    
    existing_bimal = await db.users.find_one({"email": "bimal.vishvakarma@gmail.com"})
    if not existing_bimal:
        await db.users.insert_one(bimal_admin_user)
        print("✓ Created Bimal admin user (bimal.vishvakarma@gmail.com / Admin@123)")
    else:
        print("✓ Bimal admin user already exists")
    
    # Create test user
    test_user = {
        "id": str(uuid.uuid4()),
        "email": "test@example.com",
        "name": "Test User",
        "phone_number": "+9876543210",
        "password_hash": pwd_context.hash("test123"),
        "role": "user",
        "virtual_balance": 10000.0,
        "earnings_balance": 250.0,
        "task_balance": 500.0,
        "total_investment": 2000.0,
        "google_id": None,
        "profile_picture": None,
        "is_active": True,
        "email_verified": True,
        "last_daily_login": None,
        "created_at": datetime.now(timezone.utc),
        "last_login": None
    }
    
    # Check if test user already exists
    existing_test = await db.users.find_one({"email": "test@example.com"})
    if not existing_test:
        await db.users.insert_one(test_user)
        print("✓ Created test user (test@example.com / test123)")
    else:
        print("✓ Test user already exists")
    
    # Create sample strategies
    strategies = [
        {
            "id": str(uuid.uuid4()),
            "name": "Conservative Growth",
            "description": "A low-risk strategy focused on steady, consistent returns through diversified portfolios and blue-chip investments.",
            "strategy_type": "guaranteed",
            "monthly_returns": 2.5,
            "capital_required": 1000.0,
            "logic_description": "This strategy invests in established companies with strong fundamentals, government bonds, and dividend-paying stocks. Risk is minimized through diversification across sectors and asset classes.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Momentum Trading",
            "description": "A high-frequency strategy that capitalizes on short-term price movements and market momentum indicators.",
            "strategy_type": "risky",
            "monthly_returns": 8.5,
            "capital_required": 5000.0,
            "logic_description": "Uses technical analysis, moving averages, and volume indicators to identify trending stocks. Employs stop-loss mechanisms and rapid position changes to maximize gains from market volatility.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dividend Aristocrats",
            "description": "Invests in companies with a proven track record of increasing dividends for 25+ consecutive years.",
            "strategy_type": "guaranteed",
            "monthly_returns": 1.8,
            "capital_required": 2500.0,
            "logic_description": "Focuses on S&P 500 companies that have increased their dividend payments for at least 25 consecutive years. These companies typically have stable business models and strong cash flows.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Crypto Swing Trading",
            "description": "Exploits volatility in cryptocurrency markets through swing trading techniques and algorithmic analysis.",
            "strategy_type": "risky",
            "monthly_returns": 15.2,
            "capital_required": 3000.0,
            "logic_description": "Combines blockchain analytics, sentiment analysis, and technical indicators to trade major cryptocurrencies. Uses automated tools for 24/7 market monitoring and rapid execution.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Index Fund Tracker",
            "description": "Mirrors major market indices with minimal fees and maximum diversification for long-term stability.",
            "strategy_type": "guaranteed",
            "monthly_returns": 0.9,
            "capital_required": 500.0,
            "logic_description": "Passively tracks major indices like S&P 500, NASDAQ, and international markets. Provides broad market exposure with automatic rebalancing and minimal management fees.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "name": "AI-Powered Growth",
            "description": "Uses machine learning algorithms to identify high-growth potential stocks before they break out.",
            "strategy_type": "risky",
            "monthly_returns": 12.7,
            "capital_required": 7500.0,
            "logic_description": "Employs advanced AI models trained on historical data, earnings reports, and market patterns. Analyzes thousands of data points to predict stock movements and optimize portfolio allocation.",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Check if strategies already exist
    existing_strategies = await db.strategies.count_documents({})
    if existing_strategies == 0:
        await db.strategies.insert_many(strategies)
        print(f"✓ Created {len(strategies)} sample strategies")
    else:
        print("✓ Strategies already exist")
    
    # Create sample coupons
    coupons = [
        {
            "id": str(uuid.uuid4()),
            "title": "Amazon Gift Card - $25",
            "description": "Redeem this coupon for a $25 Amazon gift card. Perfect for online shopping or treating yourself to something special.",
            "points_required": 100.0,
            "value": 25.0,
            "is_active": True,
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=90),
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Netflix Premium - 1 Month",
            "description": "Get a free month of Netflix Premium subscription. Enjoy unlimited streaming on up to 4 screens in ultra HD.",
            "points_required": 50.0,
            "value": 15.99,
            "is_active": True,
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=60),
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Starbucks Gift Card - $10",
            "description": "Enjoy your favorite coffee with a $10 Starbucks gift card. Valid at all participating locations.",
            "points_required": 40.0,
            "value": 10.0,
            "is_active": True,
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=120),
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Spotify Premium - 3 Months",
            "description": "Experience ad-free music with 3 months of Spotify Premium. Download songs and enjoy unlimited skips.",
            "points_required": 150.0,
            "value": 29.97,
            "is_active": True,
            "expiry_date": datetime.now(timezone.utc) + timedelta(days=30),
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Uber Eats Credit - $20",
            "description": "Get $20 credit for Uber Eats to order from your favorite restaurants. Free delivery included!",
            "points_required": 80.0,
            "value": 20.0,
            "is_active": True,
            "expiry_date": None,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Check if coupons already exist
    existing_coupons = await db.coupons.count_documents({})
    if existing_coupons == 0:
        await db.coupons.insert_many(coupons)
        print(f"✓ Created {len(coupons)} sample coupons")
    else:
        print("✓ Coupons already exist")
    
    print("\nTradeict Database initialization complete!")
    print("\nLogin Credentials:")
    print("Original Admin: admin@tradingsim.com / admin123")
    print("Bimal Admin: bimal.vishvakarma@gmail.com / Admin@123")
    print("Test User: test@example.com / test123")
    
    print(f"\nAdmin Dashboard URL: https://tradify-app-1.preview.emergentagent.com/admin")
    print("Note: Admin dashboard interface will be created in the next phase")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())