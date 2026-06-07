"""
Système d'authentification JWT pour le Bridge API.

Architecture de sécurité :
┌──────────────┐     POST /auth/token      ┌──────────────┐
│   Frontend   │ ──────────────────────────→ │  Bridge API  │
│  (Vercel)    │ ←────────────────────────── │  (FastAPI)   │
│              │     JWT Access Token        │              │
│              │                             │              │
│              │  GET /api/prices            │              │
│              │  Authorization: Bearer <JWT>│              │
│              │ ──────────────────────────→ │              │
└──────────────┘                             └──────────────┘

Le JWT contient :
- sub : identifiant du client
- role : "admin" ou "viewer"
- exp : date d'expiration
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

# ─── Constants ────────────────────────────────
ALGORITHM = "HS256"

# ─── Password Hashing ─────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Bearer Token Extractor ───────────────────
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash un mot de passe avec bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe contre son hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str = "viewer",
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Crée un JWT signé.

    Args:
        subject: Identifiant unique du client (ex: "ict-sniper-frontend")
        role: Niveau de permission ("admin" = lecture+écriture, "viewer" = lecture seule)
        expires_delta: Durée de validité (défaut: 24h)

    Returns:
        JWT encodé (string)
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.API_TOKEN_EXPIRE_MINUTES)

    expire = datetime.utcnow() + expires_delta

    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow(),
    }

    return jwt.encode(payload, settings.API_SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Décode et valide un JWT.

    Raises:
        HTTPException 401: Token invalide ou expiré
    """
    try:
        payload = jwt.decode(token, settings.API_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ─── Dependency Injection pour FastAPI ─────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dépendance FastAPI : extrait et valide le JWT du header Authorization.

    Usage dans un endpoint :
        @router.get("/prices")
        async def get_prices(user: dict = Depends(get_current_user)):
            # user = {"sub": "ict-sniper-frontend", "role": "admin"}
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    return payload


async def require_admin(
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Dépendance FastAPI : nécessite le rôle "admin".
    Les viewers reçoivent un 403 Forbidden.
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : rôle admin requis",
        )
    return user
