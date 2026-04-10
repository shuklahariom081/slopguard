"""
main.py — SlopGuard FastAPI Backend
=====================================
All API routes for the SlopGuard product.

Endpoints:
  POST /scan/text       — scan text content
  POST /scan/code       — scan source code
  POST /scan/image      — scan uploaded image
  GET  /history         — get user's scan history
  GET  /credits         — get user's remaining credits
  POST /webhook/razorpay — handle payment webhooks
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import (
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from auth import get_current_user, UserInfo
from credits import check_and_deduct_credit, get_credits_remaining
from detectors import detect_code_slop, detect_image_slop, detect_text_slop
from db import supabase

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SlopGuard API",
    description="Multi-modal AI slop detection — Text, Code, Images",
    version="1.0.0",
)

# Allow requests from the Next.js frontend
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class TextScanRequest(BaseModel):
    text: str

class CodeScanRequest(BaseModel):
    code: str

class ScanResponse(BaseModel):
    scan_id: str
    slop_score: int
    verdict: str
    confidence: str
    features: dict
    modality: str
    credits_remaining: int
    timestamp: str


# ---------------------------------------------------------------------------
# Helper — save scan to DB
# ---------------------------------------------------------------------------

async def _save_scan(
    user_id: str,
    modality: str,
    slop_score: int,
    verdict: str,
    confidence: str,
    features: dict,
    input_preview: str = "",
) -> str:
    """Persist a scan result to Supabase and return the scan_id."""
    scan_id = str(uuid.uuid4())
    supabase.table("scans").insert({
        "id": scan_id,
        "user_id": user_id,
        "modality": modality,
        "slop_score": slop_score,
        "verdict": verdict,
        "confidence": confidence,
        "features": features,
        "input_preview": input_preview[:300],   # store first 300 chars only
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return scan_id


# ---------------------------------------------------------------------------
# Routes — scanning
# ---------------------------------------------------------------------------

@app.post("/scan/text", response_model=ScanResponse)
async def scan_text(
    body: TextScanRequest,
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Analyse text for AI slop signals."""
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Check + deduct credit
    remaining = await check_and_deduct_credit(current_user)

    # Run detector
    result = detect_text_slop(body.text)

    # Persist
    scan_id = await _save_scan(
        user_id=current_user.id,
        modality="text",
        slop_score=result["slop_score"],
        verdict=result["verdict"],
        confidence=result["confidence"],
        features=result["features"],
        input_preview=body.text,
    )

    return ScanResponse(
        scan_id=scan_id,
        slop_score=result["slop_score"],
        verdict=result["verdict"],
        confidence=result["confidence"],
        features=result["features"],
        modality="text",
        credits_remaining=remaining,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/scan/code", response_model=ScanResponse)
async def scan_code(
    body: CodeScanRequest,
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Analyse source code for AI slop signals."""
    if not body.code or not body.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    remaining = await check_and_deduct_credit(current_user)
    result = detect_code_slop(body.code)

    scan_id = await _save_scan(
        user_id=current_user.id,
        modality="code",
        slop_score=result["slop_score"],
        verdict=result["verdict"],
        confidence=result["confidence"],
        features=result["features"],
        input_preview=body.code,
    )

    return ScanResponse(
        scan_id=scan_id,
        slop_score=result["slop_score"],
        verdict=result["verdict"],
        confidence=result["confidence"],
        features=result["features"],
        modality="code",
        credits_remaining=remaining,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/scan/image", response_model=ScanResponse)
async def scan_image(
    current_user: Annotated[UserInfo, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    """Analyse an uploaded image for AI generation signals."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Save temp file
    tmp_path = f"/tmp/{uuid.uuid4()}_{file.filename}"
    try:
        content = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(content)

        remaining = await check_and_deduct_credit(current_user)
        result = detect_image_slop(tmp_path)

        scan_id = await _save_scan(
            user_id=current_user.id,
            modality="image",
            slop_score=result["slop_score"],
            verdict=result["verdict"],
            confidence=result["confidence"],
            features=result["features"],
            input_preview=file.filename or "image",
        )

        return ScanResponse(
            scan_id=scan_id,
            slop_score=result["slop_score"],
            verdict=result["verdict"],
            confidence=result["confidence"],
            features=result["features"],
            modality="image",
            credits_remaining=remaining,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
    finally:
        # Always clean up temp file
        import os as _os
        if _os.path.exists(tmp_path):
            _os.remove(tmp_path)


# ---------------------------------------------------------------------------
# Routes — user data
# ---------------------------------------------------------------------------

@app.get("/credits")
async def get_credits(
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Return current credit balance for the authenticated user."""
    remaining = await get_credits_remaining(current_user)
    return {
        "credits_remaining": remaining,
        "plan": current_user.plan,
        "is_pro": current_user.plan == "pro",
    }


@app.get("/history")
async def get_history(
    current_user: Annotated[UserInfo, Depends(get_current_user)],
    limit: int = 20,
    offset: int = 0,
    modality: Optional[str] = None,
):
    """Return paginated scan history for the authenticated user."""
    query = (
        supabase.table("scans")
        .select("id, modality, slop_score, verdict, confidence, input_preview, created_at")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )

    if modality and modality in ("text", "code", "image"):
        query = query.eq("modality", modality)

    response = query.execute()
    return {
        "scans": response.data,
        "total": len(response.data),
        "offset": offset,
        "limit": limit,
    }


@app.get("/history/{scan_id}")
async def get_scan_detail(
    scan_id: str,
    current_user: Annotated[UserInfo, Depends(get_current_user)],
):
    """Return full detail for a single scan (must belong to current user)."""
    response = (
        supabase.table("scans")
        .select("*")
        .eq("id", scan_id)
        .eq("user_id", current_user.id)  # security: users can only see own scans
        .single()
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Scan not found.")
    return response.data


# ---------------------------------------------------------------------------
# Routes — Razorpay webhook
# ---------------------------------------------------------------------------

@app.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """
    Handle Razorpay payment webhooks.
    When a subscription payment succeeds, upgrade the user to Pro.
    """
    import hmac
    import hashlib
    import json

    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Verify signature
    expected = hmac.new(
        webhook_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    payload = json.loads(body)
    event = payload.get("event", "")

    # Payment captured → upgrade user to Pro
    if event == "payment.captured":
        payment = payload["payload"]["payment"]["entity"]
        user_email = payment.get("email")

        if user_email:
            # Find user by email and upgrade plan
            user_resp = (
                supabase.table("profiles")
                .select("id")
                .eq("email", user_email)
                .single()
                .execute()
            )
            if user_resp.data:
                supabase.table("profiles").update({
                    "plan": "pro",
                    "credits_limit": 999999,  # effectively unlimited
                }).eq("id", user_resp.data["id"]).execute()

    # Subscription cancelled → downgrade to free
    elif event == "subscription.cancelled":
        sub = payload["payload"]["subscription"]["entity"]
        user_email = sub.get("notes", {}).get("email")
        if user_email:
            user_resp = (
                supabase.table("profiles")
                .select("id")
                .eq("email", user_email)
                .single()
                .execute()
            )
            if user_resp.data:
                supabase.table("profiles").update({
                    "plan": "free",
                    "credits_limit": 10,
                }).eq("id", user_resp.data["id"]).execute()

    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SlopGuard API", "version": "1.0.0"}
