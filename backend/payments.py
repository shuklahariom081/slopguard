"""
payments.py — Razorpay Payment Integration
==========================================
Handles order creation and payment verification for SlopGuard Pro.
"""

import hmac
import hashlib
import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Annotated

from auth import get_current_user, UserInfo
from db import supabase

router = APIRouter()

# Razorpay client
client = razorpay.Client(
    auth=(
        os.getenv("RAZORPAY_KEY_ID", ""),
        os.getenv("RAZORPAY_KEY_SECRET", ""),
    )
)

# Plan prices in paise (1 INR = 100 paise)
PLANS = {
    "pro_monthly": {
        "amount": 29900,      # ₹299
        "currency": "INR",
        "description": "SlopGuard Pro — Monthly",
    },
    "pro_annual": {
        "amount": 249900,     # ₹2,499
        "currency": "INR",
        "description": "SlopGuard Pro — Annual",
    },
}


class CreateOrderRequest(BaseModel):
    plan: str  # "pro_monthly" or "pro_annual"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str


@router.post("/payment/create-order")
async def create_order(
    body: CreateOrderRequest,
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Create a Razorpay order for the selected plan."""
    if body.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")

    plan = PLANS[body.plan]

    try:
        order = client.order.create({
            "amount": plan["amount"],
            "currency": plan["currency"],
            "notes": {
                "user_id": current_user.id,
                "email": current_user.email,
                "plan": body.plan,
            }
        })

        return {
            "order_id": order["id"],
            "amount": plan["amount"],
            "currency": plan["currency"],
            "description": plan["description"],
            "key_id": os.getenv("RAZORPAY_KEY_ID", ""),
            "user_email": current_user.email,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/payment/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Verify payment signature and upgrade user to Pro."""
    webhook_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    # Verify signature
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    expected = hmac.new(
        webhook_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature.")

    # Upgrade user to Pro
    credits_limit = 999999  # unlimited
    supabase.table("profiles").update({
        "plan": "pro",
        "credits_limit": credits_limit,
        "razorpay_payment_id": body.razorpay_payment_id,
        "razorpay_order_id": body.razorpay_order_id,
    }).eq("id", current_user.id).execute()

    return {
        "success": True,
        "message": "Payment verified! You are now a Pro user.",
        "plan": "pro",
    }