from __future__ import annotations

import asyncio
import time

import httpx
from fastapi import HTTPException

from app.config import (
    EXTERNAL_API_BASE_URL,
    EXTERNAL_API_CACHE_TTL_SECONDS,
    EXTERNAL_API_KEY,
    EXTERNAL_API_MIN_INTERVAL_SECONDS,
    EXTERNAL_API_TIMEOUT_SECONDS,
)
from app.models.schemas import ExternalTermInsight, ExternalTermsResponse

_CACHE: dict[str, tuple[float, ExternalTermsResponse]] = {}
_LAST_REQUEST_AT = 0.0
_LOCK = asyncio.Lock()


class ExternalTermsService:
    def __init__(self, client_factory=None):
        self.client_factory = client_factory or self._default_client_factory

    def _default_client_factory(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=EXTERNAL_API_TIMEOUT_SECONDS)

    def _normalize(self, raw: list[dict], term: str) -> ExternalTermsResponse:
        items: list[ExternalTermInsight] = []
        for row in raw[:6]:
            word = str(row.get("word", "")).strip()
            if not word:
                continue
            score = float(row.get("score", 0) or 0)
            relevance = round(min(1.0, max(0.15, score / 100000)), 2) if score else 0.4
            tags = [str(tag) for tag in row.get("tags", [])[:4]]
            items.append(ExternalTermInsight(term=word, relevance=relevance, tags=tags))
        return ExternalTermsResponse(source="Datamuse", query=term, items=items, cached=False)

    async def search(self, term: str) -> ExternalTermsResponse:
        global _LAST_REQUEST_AT

        normalized_term = term.strip().lower()
        if not normalized_term:
            raise HTTPException(status_code=400, detail="Search term is required")

        cached = _CACHE.get(normalized_term)
        now = time.monotonic()
        if cached and now - cached[0] < EXTERNAL_API_CACHE_TTL_SECONDS:
            return cached[1].model_copy(update={"cached": True})

        async with _LOCK:
            cached = _CACHE.get(normalized_term)
            now = time.monotonic()
            if cached and now - cached[0] < EXTERNAL_API_CACHE_TTL_SECONDS:
                return cached[1].model_copy(update={"cached": True})

            delay = EXTERNAL_API_MIN_INTERVAL_SECONDS - (now - _LAST_REQUEST_AT)
            if delay > 0:
                await asyncio.sleep(delay)

            headers = {"Accept": "application/json"}
            if EXTERNAL_API_KEY:
                headers["X-API-Key"] = EXTERNAL_API_KEY

            last_error: Exception | None = None
            for attempt in range(3):
                try:
                    async with self.client_factory() as client:
                        response = await client.get(EXTERNAL_API_BASE_URL, params={"ml": normalized_term, "max": 6}, headers=headers)
                    response.raise_for_status()
                    payload = response.json()
                    normalized = self._normalize(payload if isinstance(payload, list) else [], normalized_term)
                    _CACHE[normalized_term] = (time.monotonic(), normalized)
                    _LAST_REQUEST_AT = time.monotonic()
                    return normalized
                except (httpx.HTTPError, ValueError) as exc:
                    last_error = exc
                    await asyncio.sleep(0.25 * (attempt + 1))

        raise HTTPException(status_code=502, detail=f"External API unavailable: {last_error}")
