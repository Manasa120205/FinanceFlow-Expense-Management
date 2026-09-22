"""Tests for Transaction CRUD, Pagination, Filters, and Search."""
import pytest
from datetime import date
from fastapi import status


def test_create_income_and_expense_transaction(client, auth_user_a):
    headers = auth_user_a["headers"]

    # 1. Income transaction
    inc_payload = {
        "type": "income",
        "amount": 50000.0,
        "category": "Salary",
        "description": "Tech Corp Monthly Salary",
        "transaction_date": "2026-09-01"
    }
    res_inc = client.post("/api/v1/transactions", headers=headers, json=inc_payload)
    assert res_inc.status_code == status.HTTP_201_CREATED
    data_inc = res_inc.json()
    assert data_inc["amount"] == 50000.0
    assert data_inc["type"] == "income"
    assert data_inc["category"] == "Salary"

    # 2. Expense transaction
    exp_payload = {
        "type": "expense",
        "amount": 3500.0,
        "category": "Food",
        "description": "Weekly Groceries",
        "transaction_date": "2026-09-03"
    }
    res_exp = client.post("/api/v1/transactions", headers=headers, json=exp_payload)
    assert res_exp.status_code == status.HTTP_201_CREATED
    data_exp = res_exp.json()
    assert data_exp["amount"] == 3500.0
    assert data_exp["type"] == "expense"


def test_transaction_validation_errors(client, auth_user_a):
    headers = auth_user_a["headers"]

    # Zero or negative amount
    res = client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 0,
        "category": "Food",
        "transaction_date": "2026-09-01"
    })
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid type
    res = client.post("/api/v1/transactions", headers=headers, json={
        "type": "invalid_type",
        "amount": 100,
        "category": "Food",
        "transaction_date": "2026-09-01"
    })
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_transactions_pagination_and_sorting(client, auth_user_a):
    headers = auth_user_a["headers"]

    # Create 15 transactions
    for i in range(15):
        client.post("/api/v1/transactions", headers=headers, json={
            "type": "expense" if i % 2 == 0 else "income",
            "amount": (i + 1) * 100.0,
            "category": "Food" if i % 2 == 0 else "Salary",
            "description": f"Tx {i + 1}",
            "transaction_date": f"2026-09-{min(i + 1, 28):02d}"
        })

    # Page 1 (limit 10)
    res_p1 = client.get("/api/v1/transactions?page=1&page_size=10", headers=headers)
    assert res_p1.status_code == status.HTTP_200_OK
    d1 = res_p1.json()
    assert d1["total"] == 15
    assert len(d1["items"]) == 10
    assert d1["total_pages"] == 2
    assert d1["page"] == 1

    # Page 2 (limit 10)
    res_p2 = client.get("/api/v1/transactions?page=2&page_size=10", headers=headers)
    assert res_p2.status_code == status.HTTP_200_OK
    d2 = res_p2.json()
    assert len(d2["items"]) == 5
    assert d2["page"] == 2


def test_transaction_search_and_filters(client, auth_user_a):
    headers = auth_user_a["headers"]

    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 1200.0,
        "category": "Transport",
        "description": "Metro Pass Recharge",
        "transaction_date": "2026-09-02"
    })
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 4500.0,
        "category": "Food",
        "description": "Organic Supermarket",
        "transaction_date": "2026-09-10"
    })

    # Filter by type
    res_type = client.get("/api/v1/transactions?type=expense", headers=headers)
    assert res_type.json()["total"] == 2

    # Filter by category
    res_cat = client.get("/api/v1/transactions?category=Transport", headers=headers)
    assert res_cat.json()["total"] == 1
    assert res_cat.json()["items"][0]["category"] == "Transport"

    # Search by keyword
    res_search = client.get("/api/v1/transactions?search=Metro", headers=headers)
    assert res_search.json()["total"] == 1
    assert "Metro Pass" in res_search.json()["items"][0]["description"]

    # Date range filter
    res_date = client.get(
        "/api/v1/transactions?start_date=2026-09-05&end_date=2026-09-15",
        headers=headers
    )
    assert res_date.json()["total"] == 1
    assert res_date.json()["items"][0]["amount"] == 4500.0


def test_update_and_delete_transaction(client, auth_user_a):
    headers = auth_user_a["headers"]

    create_res = client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 2000.0,
        "category": "Entertainment",
        "description": "Movie Tickets",
        "transaction_date": "2026-09-15"
    })
    tx_id = create_res.json()["id"]

    # Update
    update_res = client.put(f"/api/v1/transactions/{tx_id}", headers=headers, json={
        "amount": 2500.0,
        "description": "Movie Tickets and Snacks"
    })
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["amount"] == 2500.0
    assert update_res.json()["description"] == "Movie Tickets and Snacks"

    # Delete
    del_res = client.delete(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert del_res.status_code == status.HTTP_200_OK

    # Verify 404 after deletion
    get_res = client.get(f"/api/v1/transactions/{tx_id}", headers=headers)
    assert get_res.status_code == status.HTTP_404_NOT_FOUND
