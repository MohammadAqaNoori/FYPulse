"""
Simple in-memory rate limiter middleware.
In production, replace with Redis-backed sliding window (e.g. slowapi).
"""
from fastapi import Request, HTTPException, status
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio

# {ip: [timestamp, ...]}
_request_log: dict = defaultdict(list)
RATE_LIMIT = 100       # requests
WINDOW_SECONDS = 60    # per minute


async def rate_limit_middleware(request: Request, call_next):
    ip = request.client.host
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=WINDOW_SECONDS)

    # Purge old entries
    _request_log[ip] = [t for t in _request_log[ip] if t > window_start]

    if len(_request_log[ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down.",
        )

    _request_log[ip].append(now)
    return await call_next(request)
