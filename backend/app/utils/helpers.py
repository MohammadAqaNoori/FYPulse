from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


def paginate_response(items: list, total: int, page: int, page_size: int) -> dict:
    """Standard pagination wrapper."""
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "items": items,
    }
