"""Tests for Dashboard Metrics Calculation, Analytics, and Empty States."""
import pytest
from datetime import date
from fastapi import status


def test_dashboard_empty_state_returns_zeroes(client, auth_user_a):
    headers = auth_user_a["headers"]

    res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_income"] == 0.0
    assert data["total_expenses"] == 0.0
    assert data["current_balance"] == 0.0
    assert data["current_month_spending"] == 0.0
    assert data["total_transactions"] == 0


def test_dashboard_summary_calculation(client, auth_user_a):
    headers = auth_user_a["headers"]
    today = date.today()
    today_str = today.isoformat()

    # Add Income
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "income",
        "amount": 75000.0,
        "category": "Salary",
        "description": "Monthly Salary",
        "transaction_date": today_str
    })

    # Add Expense 1
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 15000.0,
        "category": "Rent",
        "description": "Apartment Rent",
        "transaction_date": today_str
    })

    # Add Expense 2
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 5000.0,
        "category": "Food",
        "description": "Groceries",
        "transaction_date": today_str
    })

    res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()

    assert data["total_income"] == 75000.0
    assert data["total_expenses"] == 20000.0
    assert data["current_balance"] == 55000.0
    assert data["current_month_spending"] == 20000.0
    assert data["total_transactions"] == 3


def test_monthly_trends_and_category_breakdown(client, auth_user_a):
    headers = auth_user_a["headers"]
    today = date.today()

    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 6000.0,
        "category": "Shopping",
        "transaction_date": today.isoformat()
    })
    client.post("/api/v1/transactions", headers=headers, json={
        "type": "expense",
        "amount": 4000.0,
        "category": "Bills",
        "transaction_date": today.isoformat()
    })

    # Monthly trends
    res_m = client.get("/api/v1/dashboard/monthly?months=6", headers=headers)
    assert res_m.status_code == status.HTTP_200_OK
    assert len(res_m.json()["trends"]) == 6

    # Category breakdown
    res_c = client.get(
        f"/api/v1/dashboard/categories?month={today.month}&year={today.year}",
        headers=headers
    )
    assert res_c.status_code == status.HTTP_200_OK
    cat_data = res_c.json()
    assert cat_data["total_expense"] == 10000.0
    categories = {c["category"]: c for c in cat_data["categories"]}
    assert categories["Shopping"]["amount"] == 6000.0
    assert categories["Shopping"]["percentage"] == 60.0
    assert categories["Bills"]["amount"] == 4000.0
    assert categories["Bills"]["percentage"] == 40.0
