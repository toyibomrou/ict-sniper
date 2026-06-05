"""
Middleware de limitation de débit (Rate Limiting).

Protège l'API contre les abus :
- 60 requêtes/minute par défaut
- Retourne 429 Too Many Requests si dépassé
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting par adresse IP.
    Chaque IP a droit à RATE_LIMIT_PER_MINUTE requêtes par minute.
    """

    def __init__(self, app, rate_limit: int = None):
        super().__init__(app)
        self.rate_limit = rate_limit or settings.RATE_LIMIT_PER_MINUTE
        self.requests = defaultdict(list)  # ip → [timestamps]

    async def dispatch(self, request: Request, call_next):
        # Ignorer le health check
        if request.url.path == "/health":
            return await call_next(request)

        # Obtenir l'IP du client
        client_ip = request.client.host if request.client else "unknown"

        # Nettoyer les anciens timestamps
        now = time.time()
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] if now - t < 60
        ]

        # Vérifier la limite
        if len(self.requests[client_ip]) >= self.rate_limit:
            logger.warning(f"Rate limit dépassé pour {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit dépassé: {self.rate_limit} requêtes/minute",
            )

        # Enregistrer la requête
        self.requests[client_ip].append(now)

        # Continuer
        response = await call_next(request)
        return response
