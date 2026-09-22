"""Tests Strictly Enforcing User Data Isolation Between Different Accounts."""
import pytest
from fastapi import status


def test_user_cannot_view_or_modify_other_user_transactions(client, auth_user_a, auth_user_b):
    headers_a = auth_user_a["headers"]
    headers_b = auth_user_b["headers"]

    # 1. User A creates a transaction
    res_a = client.post("/api/v1/transactions", headers=headers_a, json={
        "type": "expense",
        "amount": 1500.0,
        "category": "Food",
        "description": "User A Private Grocery",
        "transaction_date": "2026-09-10"
    })
    assert res_a.status_code == status.HTTP_201_CREATED
    tx_id_a = res_a.json()["id"]

    # 2. User B tries to view User A's transaction directly by ID -> Must be 404
    res_b_view = client.get(f"/api/v1/transactions/{tx_id_a}", headers=headers_b)
    assert res_b_view.status_code == status.HTTP_404_NOT_FOUND

    # 3. User B tries to modify User A's transaction -> Must be 404
    res_b_edit = client.put(f"/api/v1/transactions/{tx_id_a}", headers=headers_b, json={
        "amount": 99999.0,
        "description": "Hacked Transaction"
    })
    assert res_b_edit.status_code == status.HTTP_404_NOT_FOUND

    # 4. User B tries to delete User A's transaction -> Must be 404
    res_b_del = client.delete(f"/api/v1/transactions/{tx_id_a}", headers=headers_b)
    assert res_b_del.status_code == status.HTTP_404_NOT_FOUND

    # 5. User B lists transactions -> User A's transaction must NOT appear
    res_b_list = client.get("/api/v1/transactions", headers=headers_b)
    assert res_b_list.status_code == status.HTTP_200_OK
    assert res_b_list.json()["total"] == 0
    assert len(res_b_list.json()["items"]) == 0

    # 6. Verify User A's transaction is still intact and unchanged
    res_a_check = client.get(f"/api/v1/transactions/{tx_id_a}", headers=headers_a)
    assert res_a_check.status_code == status.HTTP_200_OK
    assert res_a_check.json()["amount"] == 1500.0
    assert res_a_check.json()["description"] == "User A Private Grocery"


def test_user_cannot_view_or_modify_other_user_budgets(client, auth_user_a, auth_user_b):
    headers_a = auth_user_a["headers"]
    headers_b = auth_user_b["headers"]

    # 1. User A creates a budget
    res_a = client.post("/api/v1/budgets", headers=headers_a, json={
        "category": "Food",
        "amount": 10000.0,
        "month": 9,
        "year": 2026
    })
    assert res_a.status_code == status.HTTP_201_CREATED
    budget_id_a = res_a.json()["id"]

    # 2. User B tries to edit User A's budget -> Must be 404
    res_b_edit = client.put(f"/api/v1/budgets/{budget_id_a}", headers=headers_b, json={
        "amount": 500.0
    })
    assert res_b_edit.status_code == status.HTTP_404_NOT_FOUND

    # 3. User B tries to delete User A's budget -> Must be 404
    res_b_del = client.delete(f"/api/v1/budgets/{budget_id_a}", headers=headers_b)
    assert res_b_del.status_code == status.HTTP_404_NOT_FOUND

    # 4. User B lists budgets for same month -> User A's budget must NOT appear
    res_b_list = client.get("/api/v1/budgets?month=9&year=2026", headers=headers_b)
    assert res_b_list.status_code == status.HTTP_200_OK
    assert len(res_b_list.json()["items"]) == 0


def test_dashboard_metrics_do_not_leak_across_users(client, auth_user_a, auth_user_b):
    headers_a = auth_user_a["headers"]
    headers_b = auth_user_b["headers"]

    # User A records high income and expense
    client.post("/api/v1/transactions", headers=headers_a, json={
        "type": "income",
        "amount": 100000.0,
        "category": "Salary",
        "transaction_date": "2026-09-01"
    })
    client.post("/api/v1/transactions", headers=headers_a, json={
        "type": "expense",
        "amount": 30000.0,
        "category": "Rent",
        "transaction_date": "2026-09-02"
    })

    # User B's dashboard must remain zero
    res_b_dash = client.get("/api/v1/dashboard/summary", headers=headers_b)
    data_b = res_b_dash.json()
    assert data_b["total_income"] == 0.0
    assert data_b["total_expenses"] == 0.0
    assert data_b["current_balance"] == 0.0
    assert data_b["total_transactions"] == 0
