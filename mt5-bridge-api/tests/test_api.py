"""
Script de test rapide pour vérifier que le Bridge API fonctionne.

Usage :
    python tests/test_api.py
"""

import httpx
import asyncio
import json

BASE_URL = "http://localhost:5555"


async def test_api():
    async with httpx.AsyncClient() as client:

        # 1. Health check
        print("1️⃣  Test Health Check...")
        r = await client.get(f"{BASE_URL}/health")
        print(f"   Status: {r.status_code}")
        print(f"   Response: {json.dumps(r.json(), indent=2)}")

        # 2. Obtenir un token (remplace par ton vrai secret)
        print("\n2️⃣  Test Auth Token...")
        r = await client.post(f"{BASE_URL}/auth/token", json={
            "client_id": "ict-sniper-frontend",
            "client_secret": "dev-key-change-in-production",
        })
        if r.status_code == 200:
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print(f"   ✅ Token obtenu (premiers 20 chars): {token[:20]}...")
        else:
            print(f"   ❌ Erreur: {r.text}")
            return

        # 3. Statut MT5
        print("\n3️⃣  Test MT5 Status...")
        r = await client.get(f"{BASE_URL}/api/mt5/status", headers=headers)
        print(f"   Status: {r.status_code}")
        print(f"   Connected: {r.json().get('connected')}")

        # 4. Prix XAUUSD
        print("\n4️⃣  Test Prix XAUUSD...")
        r = await client.get(f"{BASE_URL}/api/prices/XAUUSD", headers=headers)
        print(f"   Status: {r.status_code}")
        data = r.json()
        print(f"   XAUUSD: Bid={data.get('bid')}, Ask={data.get('ask')}")

        # 5. Prix multi-symboles
        print("\n5️⃣  Test Prix Multi-symboles...")
        r = await client.get(f"{BASE_URL}/api/prices?symbols=XAUUSD,BTCUSD,EURUSD", headers=headers)
        prices = r.json().get("prices", {})
        for symbol, tick in prices.items():
            print(f"   {symbol}: Bid={tick.get('bid')}, Ask={tick.get('ask')}")

        # 6. Chandeliers
        print("\n6️⃣  Test Chandeliers...")
        r = await client.get(f"{BASE_URL}/api/candles?symbol=XAUUSD&timeframe=M5&count=5", headers=headers)
        candles = r.json()
        print(f"   Récupéré {len(candles)} chandeliers")
        if candles:
            last = candles[-1]
            print(f"   Dernier: O={last['open']} H={last['high']} L={last['low']} C={last['close']}")

        # 7. Envoyer un ordre (simulation)
        print("\n7️⃣  Test Ordre BUY XAUUSD...")
        r = await client.post(f"{BASE_URL}/api/orders", headers=headers, json={
            "symbol": "XAUUSD",
            "order_type": "buy",
            "volume": 0.01,
            "sl": 2640.00,
            "tp": 2670.00,
        })
        print(f"   Status: {r.status_code}")
        result = r.json()
        print(f"   Success: {result.get('success')}, Ticket: {result.get('ticket')}")

        # 8. Positions ouvertes
        print("\n8️⃣  Test Positions...")
        r = await client.get(f"{BASE_URL}/api/positions", headers=headers)
        positions = r.json()
        print(f"   Positions ouvertes: {len(positions)}")
        for pos in positions:
            print(f"   #{pos['ticket']} {pos['type']} {pos['symbol']} P&L: {pos['profit']}")

        print("\n✅ Tous les tests terminés !")


if __name__ == "__main__":
    asyncio.run(test_api())
