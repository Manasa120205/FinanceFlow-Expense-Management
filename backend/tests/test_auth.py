"""Tests for User Authentication, Registration, and Login Flows."""
import pytest
from fastapi import status


def test_register_success(client):
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "jane.doe@example.com"
    assert data["user"]["name"] == "Jane Doe"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_register_duplicate_email(client):
    payload = {
        "name": "First User",
        "email": "duplicate@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == status.HTTP_201_CREATED

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in res2.json()["detail"].lower()


def test_register_password_mismatch(client):
    payload = {
        "name": "Mismatch User",
        "email": "mismatch@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_success(client):
    # Register first
    client.post("/api/v1/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "ValidPassword123!",
        "confirm_password": "ValidPassword123!"
    })

    # Login
    response = client.post("/api/v1/auth/login", json={
        "email": "login@example.com",
        "password": "ValidPassword123!"
    })
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@example.com"


def test_login_invalid_credentials(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    })
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "invalid email or password" in response.json()["detail"].lower()


def test_get_current_user_me(client, auth_user_a):
    response = client.get("/api/v1/auth/me", headers=auth_user_a["headers"])
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "alpha@example.com"
    assert data["name"] == "User Alpha"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_update_profile_name(client, auth_user_a):
    response = client.put(
        "/api/v1/profile",
        headers=auth_user_a["headers"],
        json={"name": "Updated Alpha Name"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Updated Alpha Name"

    # Verify /me returns the updated name
    me_res = client.get("/api/v1/auth/me", headers=auth_user_a["headers"])
    assert me_res.json()["name"] == "Updated Alpha Name"
