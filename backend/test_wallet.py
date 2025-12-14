import requests
from decimal import Decimal

BASE_URL = "http://127.0.0.1:8000"

# --------------------------
# 1️⃣ Signup/Login a test user
# --------------------------
email = "testuser11@example.com"
password = "Test123"

signup_resp = requests.post(f"{BASE_URL}/auth/signup", json={"email": email, "password": password})
if signup_resp.status_code == 400:
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    token = login_resp.json()["access_token"]
else:
    token = signup_resp.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}
print(f"✅ Logged in. Token: {token[:10]}...")

# --------------------------
# Helper to pretty-print wallet
# --------------------------
def print_wallet_value():
    resp = requests.get(f"{BASE_URL}/wallet/value", headers=headers)
    data = resp.json()
    print(f"\n💰 Wallet Total Value: ${data['total_value']:.2f}")
    print(f"   Cash: ${data['cash']:.2f}")
    print("   Holdings:")
    for h in data["holdings"]:
        print(f"     {h['ticker']}: {h['quantity']} shares @ ${h['current_price']:.2f} = ${h['holding_value']:.2f}")

# --------------------------
# 2️⃣ Initial wallet value
# --------------------------
print_wallet_value()

# --------------------------
# 3️⃣ Buy some stock
# --------------------------
ticker_to_buy = "AAPL"
quantity_to_buy = "1.5"

buy_resp = requests.post(
    f"{BASE_URL}/wallet/buy",
    headers=headers,
    json={"ticker": ticker_to_buy, "quantity": quantity_to_buy}
)
print(f"\n🛒 Bought {quantity_to_buy} {ticker_to_buy}:")
print(buy_resp.json())
print_wallet_value()

# --------------------------
# 4️⃣ Sell some stock
# --------------------------
quantity_to_sell = "0.5"

sell_resp = requests.post(
    f"{BASE_URL}/wallet/sell",
    headers=headers,
    json={"ticker": ticker_to_buy, "quantity": quantity_to_sell}
)
print(f"\n💸 Sold {quantity_to_sell} {ticker_to_buy}:")
print(sell_resp.json())
print_wallet_value()
