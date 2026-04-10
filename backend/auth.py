"""
auth.py — Authentication middleware
=====================================
Verifies Supabase JWT tokens sent by the Next.js frontend.
Injects a UserInfo object into every protected route.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from db import supabase


@dataclass
class UserInfo:
    id: str
    email: str
    plan: str          # "free" or "pro"
    credits_limit: int


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> UserInfo:
    """
    FastAPI dependency — extracts and verifies the Bearer JWT from the
    Authorization header, then returns a UserInfo object.

    Usage in routes:
        current_user: Annotated[UserInfo, Depends(get_current_user)]
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )

    token = authorization.removeprefix("Bearer ").strip()

    # Verify token with Supabase (handles expiry, signature, etc.)
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise ValueError("Invalid token")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired. Please log in again.",
        )

    user = user_response.user

    # Fetch profile (plan, credits_limit) from our profiles table
    profile_resp = (
        supabase.table("profiles")
        .select("plan, credits_limit")
        .eq("id", user.id)
        .single()
        .execute()
    )

    if not profile_resp.data:
        # Auto-create profile for new users
        supabase.table("profiles").insert({
            "id": user.id,
            "email": user.email,
            "plan": "free",
            "credits_limit": 10,
        }).execute()
        plan = "free"
        credits_limit = 10
    else:
        plan = profile_resp.data.get("plan", "free")
        credits_limit = profile_resp.data.get("credits_limit", 10)

    return UserInfo(
        id=user.id,
        email=user.email or "",
        plan=plan,
        credits_limit=credits_limit,
    )
