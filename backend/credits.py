"""
credits.py — Credit / Usage Tracking
======================================
Free users get 10 scans per day.
Pro users get effectively unlimited scans.

Credits reset at midnight UTC every day for free users.
"""

from __future__ import annotations

from datetime import datetime, timezone, date
from fastapi import HTTPException, status

from auth import UserInfo
from db import supabase


FREE_DAILY_LIMIT = 10
PRO_DAILY_LIMIT = 999_999   # effectively unlimited


async def get_credits_remaining(user: UserInfo) -> int:
    """Return how many scans the user can still perform today."""
    if user.plan == "pro":
        return PRO_DAILY_LIMIT

    today = date.today().isoformat()

    # Count scans performed today
    resp = (
        supabase.table("scans")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .gte("created_at", f"{today}T00:00:00+00:00")
        .lte("created_at", f"{today}T23:59:59+00:00")
        .execute()
    )

    used_today = resp.count or 0
    remaining = max(0, FREE_DAILY_LIMIT - used_today)
    return remaining


async def check_and_deduct_credit(user: UserInfo) -> int:
    """
    Check if the user has credits remaining.
    Raises HTTP 429 if they are out of credits.
    Returns the new remaining count after deduction.
    """
    if user.plan == "pro":
        return PRO_DAILY_LIMIT

    remaining = await get_credits_remaining(user)

    if remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "daily_limit_reached",
                "message": (
                    "You've used all 10 free scans for today. "
                    "Upgrade to Pro for unlimited scans."
                ),
                "upgrade_url": "/pricing",
            },
        )

    # Credit is deducted implicitly — we count scans in the DB.
    # No separate deduction needed; the scan insert IS the deduction.
    return remaining - 1  # return what will remain after this scan
