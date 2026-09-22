"""Tests for Budget Creation, Duplicate Prevention, Progress Tracking, and Warning Thresholds."""
import pytest
from fastapi import status


def test_create_budget_and_duplicate_prevention(client, auth_user_a):
    headers = auth_user_a["headers"]

    payload = {
        "category": "Food",
        "amount": 8000.0,
        "month": 9,
        "year": 2026
    }
    res = client.post("/api/v1/budgets", headers=headers, json=payload)
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["amount"] == 8000.0

    # Duplicate budget for same category/month/year
    res_dup = client.post("/api/v1/budgets", headers=headers, json=payload)
    assert res_dup.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in res_dup.json()["detail"].lower()


def test_budget_progress_warning_and_exceeded(client, auth_user_a):
    headers = auth_user_a["headers"]

    # 1. Create budget of 5000 for Food in Sep 2026
    client.post("/api/v1/budgets", headers=headers, json={
        "category": "Food",
        "amount": 5000.0,
        "month": 9,
        "year": 2026
    })

    # 2. Add expense of 4200 (84% -> Warning should be True)
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 4200.0,
        "category": "Food",
        "description": "Weekly Groceries",
        "transaction_date": "2026-09-10"
    })

    res = client.get("/api/v1/budgets?month=9&year=2026", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert len(data["items"]) == 1
    item = data["items"][0]
    assert item["actual_spent"] == 4200.0
    assert item["remaining"] == 800.0
    assert item["percentage_used"] == 84.0
    assert item["is_warning"] is True
    assert item["is_exceeded"] is False

    # 3. Add more expense of 1000 (total 5200 -> Exceeded should be True)
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 1000.0,
        "category": "Food",
        "description": "Weekend Restaurant",
        "transaction_date": "2026-09-15"
    })

    res2 = client.get("/api/v1/budgets?month=9&year=2026", headers=headers)
    data2 = res2.json()
    item2 = data2["items"][0]
    assert item2["actual_spent"] == 5200.0
    assert item2["remaining"] == 0.0
    assert item2["percentage_used"] == 104.0
    assert item2["is_warning"] is False
    assert item2["is_exceeded"] is True


def test_update_and_delete_budget(client, auth_user_a):
    headers = auth_user_a["headers"]

    create_res = client.post("/api/v1/budgets", headers=headers, json={
        "category": "Transport",
        "amount": 3000.0,
        "month": 9,
        "year": 2026
    })
    b_id = create_res.json()["id"]

    # Update amount
    up_res = client.put(f"/api/v1/budgets/{b_id}", headers=headers, json={"amount": 4500.0})
    assert up_res.status_code == status.HTTP_200_OK
    assert up_res.json()["amount"] == 4500.0

    # Delete budget
    del_res = client.delete(f"/api/v1/budgets/{b_id}", headers=headers)
    assert del_res.status_code == status.HTTP_200_OK

    # Verify deleted from list
    list_res = client.get("/api/v1/budgets?month=9&year=2026", headers=headers)
    assert len(list_res.json()["items"]) == 0
