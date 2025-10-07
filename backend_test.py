#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Trading Simulation App
Tests all authentication, strategy management, wallet, coupon, and admin endpoints
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta
import io
import pandas as pd

# Configuration
BASE_URL = "https://tradify-app-1.preview.emergentagent.com/api"

# Test users
ADMIN_USER = {
    "email": "admin@tradingsim.com",
    "password": "admin123"
}

TEST_USER = {
    "email": "test@example.com", 
    "password": "test123"
}

# Global variables for tokens
admin_token = None
user_token = None

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, test_name):
        self.passed += 1
        print(f"✅ {test_name}")
    
    def failure(self, test_name, error):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")

def make_request(method, endpoint, data=None, files=None, headers=None, token=None):
    """Make HTTP request with proper error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    if headers is None:
        headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == "POST":
            if files:
                response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
            else:
                headers["Content-Type"] = "application/json"
                response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "PUT":
            headers["Content-Type"] = "application/json"
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_user_registration(result):
    """Test user registration endpoint"""
    print("\n--- Testing User Registration ---")
    
    # Test with new user
    new_user_data = {
        "email": "newuser@test.com",
        "name": "New Test User",
        "password": "newpassword123"
    }
    
    response = make_request("POST", "/auth/register", new_user_data)
    
    if response and response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            result.success("User registration with valid data")
        else:
            result.failure("User registration", "Missing access_token or user in response")
    else:
        result.failure("User registration", f"Status: {response.status_code if response else 'No response'}")
    
    # Test duplicate email
    response = make_request("POST", "/auth/register", new_user_data)
    if response and response.status_code == 400:
        result.success("User registration duplicate email validation")
    else:
        result.failure("User registration duplicate email", f"Expected 400, got {response.status_code if response else 'No response'}")

def test_user_login(result):
    """Test user login endpoint"""
    print("\n--- Testing User Login ---")
    global admin_token, user_token
    
    # Test admin login
    response = make_request("POST", "/auth/login", ADMIN_USER)
    if response and response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            admin_token = data["access_token"]
            if data["user"]["role"] == "admin":
                result.success("Admin user login")
            else:
                result.failure("Admin user login", "User role is not admin")
        else:
            result.failure("Admin user login", "Missing access_token or user in response")
    else:
        result.failure("Admin user login", f"Status: {response.status_code if response else 'No response'}")
    
    # Test regular user login
    response = make_request("POST", "/auth/login", TEST_USER)
    if response and response.status_code == 200:
        data = response.json()
        if "access_token" in data and "user" in data:
            user_token = data["access_token"]
            result.success("Regular user login")
        else:
            result.failure("Regular user login", "Missing access_token or user in response")
    else:
        result.failure("Regular user login", f"Status: {response.status_code if response else 'No response'}")
    
    # Test invalid credentials
    invalid_user = {"email": "invalid@test.com", "password": "wrongpassword"}
    response = make_request("POST", "/auth/login", invalid_user)
    if response and response.status_code == 401:
        result.success("Invalid credentials validation")
    else:
        result.failure("Invalid credentials validation", f"Expected 401, got {response.status_code if response else 'No response'}")

def test_google_oauth_session(result):
    """Test Google OAuth session data endpoint"""
    print("\n--- Testing Google OAuth Session ---")
    
    # Test without session ID
    response = make_request("GET", "/auth/session-data")
    if response and response.status_code == 400:
        result.success("Google OAuth session without session ID validation")
    else:
        result.failure("Google OAuth session validation", f"Expected 400, got {response.status_code if response else 'No response'}")
    
    # Test with invalid session ID
    headers = {"X-Session-ID": "invalid-session-id"}
    response = make_request("GET", "/auth/session-data", headers=headers)
    if response and response.status_code in [401, 500]:
        result.success("Google OAuth session with invalid session ID")
    else:
        result.failure("Google OAuth session invalid ID", f"Expected 401/500, got {response.status_code if response else 'No response'}")

def test_logout(result):
    """Test logout endpoint"""
    print("\n--- Testing Logout ---")
    
    if user_token:
        response = make_request("POST", "/auth/logout", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                result.success("User logout")
            else:
                result.failure("User logout", "Missing message in response")
        else:
            result.failure("User logout", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("User logout", "No user token available")

def test_get_strategies(result):
    """Test get all strategies endpoint"""
    print("\n--- Testing Get All Strategies ---")
    
    if user_token:
        response = make_request("GET", "/strategies", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Get all strategies")
                return data
            else:
                result.failure("Get all strategies", "Response is not a list")
        else:
            result.failure("Get all strategies", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get all strategies", "No user token available")
    
    return []

def test_get_specific_strategy(result, strategies):
    """Test get specific strategy endpoint"""
    print("\n--- Testing Get Specific Strategy ---")
    
    if not strategies:
        result.failure("Get specific strategy", "No strategies available for testing")
        return
    
    strategy_id = strategies[0]["id"]
    
    if user_token:
        response = make_request("GET", f"/strategies/{strategy_id}", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and data["id"] == strategy_id:
                result.success("Get specific strategy")
            else:
                result.failure("Get specific strategy", "Strategy ID mismatch")
        else:
            result.failure("Get specific strategy", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get specific strategy", "No user token available")
    
    # Test invalid strategy ID
    response = make_request("GET", "/strategies/invalid-id", token=user_token)
    if response and response.status_code == 404:
        result.success("Get specific strategy - invalid ID validation")
    else:
        result.failure("Get specific strategy invalid ID", f"Expected 404, got {response.status_code if response else 'No response'}")

def test_admin_create_strategy(result):
    """Test admin create strategy endpoint"""
    print("\n--- Testing Admin Create Strategy ---")
    
    strategy_data = {
        "name": "Test Strategy",
        "description": "A test strategy for automated testing",
        "strategy_type": "risky",
        "monthly_returns": 15.5,
        "capital_required": 1000.0,
        "logic_description": "Test logic for automated testing"
    }
    
    if admin_token:
        response = make_request("POST", "/strategies", strategy_data, token=admin_token)
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and data["name"] == strategy_data["name"]:
                result.success("Admin create strategy")
            else:
                result.failure("Admin create strategy", "Invalid response data")
        else:
            result.failure("Admin create strategy", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Admin create strategy", "No admin token available")
    
    # Test non-admin access
    if user_token:
        response = make_request("POST", "/strategies", strategy_data, token=user_token)
        if response and response.status_code == 403:
            result.success("Admin create strategy - non-admin access validation")
        else:
            result.failure("Admin create strategy non-admin", f"Expected 403, got {response.status_code if response else 'No response'}")

def test_user_invest_in_strategy(result, strategies):
    """Test user invest in strategy endpoint"""
    print("\n--- Testing User Invest in Strategy ---")
    
    if not strategies:
        result.failure("User invest in strategy", "No strategies available for testing")
        return
    
    strategy = strategies[0]
    investment_amount = strategy["capital_required"]
    
    # Use form data as per the endpoint definition
    form_data = {
        "strategy_id": strategy["id"],
        "amount": investment_amount
    }
    
    if user_token:
        # Make request with form data
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/user-strategies", data=form_data, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data and "user_strategy_id" in data:
                result.success("User invest in strategy")
            else:
                result.failure("User invest in strategy", "Invalid response format")
        else:
            result.failure("User invest in strategy", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("User invest in strategy", "No user token available")

def test_get_user_strategies(result):
    """Test get user strategies endpoint"""
    print("\n--- Testing Get User Strategies ---")
    
    if user_token:
        response = make_request("GET", "/user-strategies", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Get user strategies")
            else:
                result.failure("Get user strategies", "Response is not a list")
        else:
            result.failure("Get user strategies", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get user strategies", "No user token available")

def test_get_wallet(result):
    """Test get wallet info endpoint"""
    print("\n--- Testing Get Wallet Info ---")
    
    if user_token:
        response = make_request("GET", "/wallet", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ["virtual_balance", "earnings_balance", "total_balance"]
            if all(field in data for field in required_fields):
                result.success("Get wallet info")
            else:
                result.failure("Get wallet info", f"Missing required fields: {required_fields}")
        else:
            result.failure("Get wallet info", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get wallet info", "No user token available")

def test_get_transactions(result):
    """Test get transaction history endpoint"""
    print("\n--- Testing Get Transaction History ---")
    
    if user_token:
        response = make_request("GET", "/transactions", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Get transaction history")
            else:
                result.failure("Get transaction history", "Response is not a list")
        else:
            result.failure("Get transaction history", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get transaction history", "No user token available")

def test_get_coupons(result):
    """Test get available coupons endpoint"""
    print("\n--- Testing Get Available Coupons ---")
    
    if user_token:
        response = make_request("GET", "/coupons", token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Get available coupons")
                return data
            else:
                result.failure("Get available coupons", "Response is not a list")
        else:
            result.failure("Get available coupons", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Get available coupons", "No user token available")
    
    return []

def test_redeem_coupon(result, coupons):
    """Test redeem coupon endpoint"""
    print("\n--- Testing Redeem Coupon ---")
    
    if not coupons:
        result.failure("Redeem coupon", "No coupons available for testing")
        return
    
    coupon = coupons[0]
    form_data = {"coupon_id": coupon["id"]}
    
    if user_token:
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/coupons/redeem", data=form_data, headers=headers, timeout=30)
        
        if response and response.status_code in [200, 400]:
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    result.success("Redeem coupon")
                else:
                    result.failure("Redeem coupon", "Invalid response format")
            else:
                # 400 is expected if insufficient earnings balance
                result.success("Redeem coupon - insufficient balance validation")
        else:
            result.failure("Redeem coupon", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Redeem coupon", "No user token available")

def test_admin_create_coupon(result):
    """Test admin create coupon endpoint"""
    print("\n--- Testing Admin Create Coupon ---")
    
    coupon_data = {
        "title": "Test Coupon",
        "description": "A test coupon for automated testing",
        "points_required": 100.0,
        "value": 50.0,
        "expiry_date": (datetime.now() + timedelta(days=30)).isoformat()
    }
    
    if admin_token:
        response = make_request("POST", "/admin/coupons", coupon_data, token=admin_token)
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and data["title"] == coupon_data["title"]:
                result.success("Admin create coupon")
            else:
                result.failure("Admin create coupon", "Invalid response data")
        else:
            result.failure("Admin create coupon", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Admin create coupon", "No admin token available")

def test_admin_get_users(result):
    """Test admin get all users endpoint"""
    print("\n--- Testing Admin Get All Users ---")
    
    if admin_token:
        response = make_request("GET", "/admin/users", token=admin_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Admin get all users")
            else:
                result.failure("Admin get all users", "Response is not a list")
        else:
            result.failure("Admin get all users", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Admin get all users", "No admin token available")
    
    # Test non-admin access
    if user_token:
        response = make_request("GET", "/admin/users", token=user_token)
        if response and response.status_code == 403:
            result.success("Admin get all users - non-admin access validation")
        else:
            result.failure("Admin get users non-admin", f"Expected 403, got {response.status_code if response else 'No response'}")

def test_admin_get_subscription_requests(result):
    """Test admin get subscription requests endpoint"""
    print("\n--- Testing Admin Get Subscription Requests ---")
    
    if admin_token:
        response = make_request("GET", "/admin/subscription-requests", token=admin_token)
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                result.success("Admin get subscription requests")
            else:
                result.failure("Admin get subscription requests", "Response is not a list")
        else:
            result.failure("Admin get subscription requests", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Admin get subscription requests", "No admin token available")

def test_admin_csv_upload(result):
    """Test admin CSV upload for trading results"""
    print("\n--- Testing Admin CSV Upload ---")
    
    # Create sample CSV data
    csv_data = """Date,TransactionType,StrategyName,TradeDetails,ProfitLossPercentage
2024-01-15,BUY,Growth Strategy,AAPL Stock Purchase,5.2
2024-01-16,SELL,Value Strategy,MSFT Stock Sale,-2.1
2024-01-17,BUY,Tech Strategy,GOOGL Stock Purchase,8.5"""
    
    if admin_token:
        files = {'file': ('test_trading_results.csv', csv_data, 'text/csv')}
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/admin/upload-trading-results", files=files, headers=headers, timeout=30)
        
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data:
                result.success("Admin CSV upload")
            else:
                result.failure("Admin CSV upload", "Invalid response format")
        else:
            result.failure("Admin CSV upload", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Admin CSV upload", "No admin token available")
    
    # Test invalid file format
    if admin_token:
        files = {'file': ('test.txt', 'invalid content', 'text/plain')}
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.post(f"{BASE_URL}/admin/upload-trading-results", files=files, headers=headers, timeout=30)
        
        if response and response.status_code == 400:
            result.success("Admin CSV upload - invalid file format validation")
        else:
            result.failure("Admin CSV upload invalid format", f"Expected 400, got {response.status_code if response else 'No response'}")

def test_create_subscription_request(result, strategies):
    """Test create subscription request endpoint"""
    print("\n--- Testing Create Subscription Request ---")
    
    if not strategies:
        result.failure("Create subscription request", "No strategies available for testing")
        return
    
    request_data = {
        "strategy_id": strategies[0]["id"],
        "user_name": "Test User",
        "user_email": "testuser@example.com",
        "phone_number": "+1234567890",
        "message": "I'm interested in this strategy"
    }
    
    if user_token:
        response = make_request("POST", "/subscription-requests", request_data, token=user_token)
        if response and response.status_code == 200:
            data = response.json()
            if "message" in data and "request_id" in data:
                result.success("Create subscription request")
            else:
                result.failure("Create subscription request", "Invalid response format")
        else:
            result.failure("Create subscription request", f"Status: {response.status_code if response else 'No response'}")
    else:
        result.failure("Create subscription request", "No user token available")

def main():
    """Run all backend API tests"""
    print(f"Starting comprehensive backend API testing...")
    print(f"Base URL: {BASE_URL}")
    print(f"{'='*60}")
    
    result = TestResult()
    
    # Authentication Tests
    test_user_registration(result)
    test_user_login(result)
    test_google_oauth_session(result)
    test_logout(result)
    
    # Re-login for subsequent tests (since we logged out)
    print("\n--- Re-authenticating for subsequent tests ---")
    admin_response = make_request("POST", "/auth/login", ADMIN_USER)
    user_response = make_request("POST", "/auth/login", TEST_USER)
    
    global admin_token, user_token
    if admin_response and admin_response.status_code == 200:
        admin_token = admin_response.json()["access_token"]
    if user_response and user_response.status_code == 200:
        user_token = user_response.json()["access_token"]
    
    # Strategy Management Tests
    strategies = test_get_strategies(result)
    test_get_specific_strategy(result, strategies)
    test_admin_create_strategy(result)
    test_user_invest_in_strategy(result, strategies)
    test_get_user_strategies(result)
    
    # Wallet & Transaction Tests
    test_get_wallet(result)
    test_get_transactions(result)
    
    # Coupon System Tests
    coupons = test_get_coupons(result)
    test_redeem_coupon(result, coupons)
    test_admin_create_coupon(result)
    
    # Admin Functionality Tests
    test_admin_get_users(result)
    test_admin_get_subscription_requests(result)
    test_admin_csv_upload(result)
    
    # Subscription Request Tests
    test_create_subscription_request(result, strategies)
    
    # Print final summary
    result.summary()
    
    return result.failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)