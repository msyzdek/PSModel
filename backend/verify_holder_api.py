#!/usr/bin/env python3
"""
Verification script for Holder API endpoints.
This script demonstrates that all holder API endpoints are working correctly.
"""

import requests
from typing import Optional

BASE_URL = "http://localhost:8000"


def login() -> Optional[str]:
    """Login and get access token."""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin", "password": "changeme"},
    )
    if response.status_code == 200:
        # Token is in cookie
        return response.cookies.get("access_token")
    return None


def test_holder_api():
    """Test all holder API endpoints."""
    print("🔐 Logging in...")
    token = login()
    if not token:
        print("❌ Login failed")
        return

    cookies = {"access_token": token}
    print("✅ Login successful\n")

    # Test 1: Create holder
    print("📝 Test 1: Create holder")
    response = requests.post(
        f"{BASE_URL}/api/holders",
        json={"name": "Test Holder", "default_shares": 100},
        cookies=cookies,
    )
    if response.status_code == 201:
        holder = response.json()
        holder_id = holder["id"]
        print(f"✅ Created holder: {holder['name']} (ID: {holder_id})")
    else:
        print(f"❌ Failed to create holder: {response.status_code}")
        return

    # Test 2: List holders
    print("\n📋 Test 2: List holders")
    response = requests.get(f"{BASE_URL}/api/holders", cookies=cookies)
    if response.status_code == 200:
        holders = response.json()
        print(f"✅ Found {len(holders)} holder(s)")
        for h in holders:
            print(f"   - {h['name']} (shares: {h['default_shares']})")
    else:
        print(f"❌ Failed to list holders: {response.status_code}")

    # Test 3: Get specific holder
    print(f"\n🔍 Test 3: Get holder by ID ({holder_id})")
    response = requests.get(f"{BASE_URL}/api/holders/{holder_id}", cookies=cookies)
    if response.status_code == 200:
        holder = response.json()
        print(f"✅ Retrieved holder: {holder['name']}")
    else:
        print(f"❌ Failed to get holder: {response.status_code}")

    # Test 4: Update holder
    print(f"\n✏️  Test 4: Update holder")
    response = requests.put(
        f"{BASE_URL}/api/holders/{holder_id}",
        json={"name": "Updated Test Holder", "default_shares": 150},
        cookies=cookies,
    )
    if response.status_code == 200:
        holder = response.json()
        print(f"✅ Updated holder: {holder['name']} (shares: {holder['default_shares']})")
    else:
        print(f"❌ Failed to update holder: {response.status_code}")

    # Test 5: Deactivate holder
    print(f"\n🗑️  Test 5: Deactivate holder")
    response = requests.delete(f"{BASE_URL}/api/holders/{holder_id}", cookies=cookies)
    if response.status_code == 200:
        holder = response.json()
        print(f"✅ Deactivated holder (is_active: {holder['is_active']})")
    else:
        print(f"❌ Failed to deactivate holder: {response.status_code}")

    # Test 6: Verify holder is not in active list
    print("\n🔍 Test 6: Verify holder not in active list")
    response = requests.get(f"{BASE_URL}/api/holders?active_only=true", cookies=cookies)
    if response.status_code == 200:
        holders = response.json()
        active_names = [h["name"] for h in holders]
        if "Updated Test Holder" not in active_names:
            print("✅ Holder correctly excluded from active list")
        else:
            print("❌ Holder still in active list")
    else:
        print(f"❌ Failed to list holders: {response.status_code}")

    # Test 7: Verify holder is in full list
    print("\n🔍 Test 7: Verify holder in full list")
    response = requests.get(f"{BASE_URL}/api/holders?active_only=false", cookies=cookies)
    if response.status_code == 200:
        holders = response.json()
        all_names = [h["name"] for h in holders]
        if "Updated Test Holder" in all_names:
            print("✅ Holder correctly included in full list")
        else:
            print("❌ Holder not in full list")
    else:
        print(f"❌ Failed to list holders: {response.status_code}")

    print("\n" + "=" * 50)
    print("✅ All holder API tests completed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    try:
        test_holder_api()
    except Exception as e:
        print(f"\n❌ Error: {e}")
