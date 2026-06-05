"""
Endpoints API du Bridge MT5.

Tous les endpoints sont protégés par JWT sauf /health et /auth/token.

Architecture des endpoints :
├── GET  /health                    → Santé du serveur (public)
├── POST /auth/token                → Obtenir un JWT (public)
├── GET  /api/mt5/status            → Statut connexion MT5
├── POST /api/mt5/connect           → Connexion au compte MT5
├── POST /api/mt5/disconnect        → Déconnexion MT5
├── GET  /api/mt5/account           → Infos du compte
├── GET  /api/prices/{symbol}       → Prix temps réel
├── GET  /api/prices                → Prix multi-symboles
├── GET  /api/candles               → Chandeliers
├── POST /api/orders                → Envoyer un ordre
├── POST /api/orders/close          → Fermer une position
├── POST /api/orders/modify         → Modifier SL/TP
├── GET  /api/positions             → Positions ouvertes
├── GET  /api/history               → Historique des trades
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from loguru import logger
import time

from app.core.security import (
    create_access_token,
    get_current_user,
    require_admin,
)
from app.core.config import settings
from app.services.mt5_engine import mt5_engine
from app.models.schemas import (
    TokenRequest, TokenResponse,
    MT5ConnectRequest, MT5ConnectionStatus,
    TickData, CandleData, CandlesRequest,
    OrderRequest, OrderResponse, ClosePositionRequest, ModifyPositionRequest,
    AccountInfo, PositionInfo, TradeHistoryItem,
    HealthResponse,
)

router = APIRouter()

# Heure de démarrage du serveur
_start_time = time.time()


# ═══════════════════════════════════════════════
# PUBLIC ENDPOINTS
# ═══════════════════════════════════════════════

@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Vérifie la santé du serveur Bridge.
    Endpoint public — pas d'authentification requise.
    """
    return HealthResponse(
        status="ok",
        mt5_connected=mt5_engine.is_connected,
        simulation_mode=mt5_engine.simulation_mode,
        uptime_seconds=round(time.time() - _start_time, 1),
    )


@router.post("/auth/token", response_model=TokenResponse, tags=["Auth"])
async def get_token(request: TokenRequest):
    """
    Obtenir un JWT pour authentifier les requêtes suivantes.

    ⚠️ En production, remplace la vérification par une vraie DB.
    Pour le MVP, on utilise un client_id/secret codé en dur.

    Exemple de requête :
        POST /auth/token
        {
            "client_id": "ict-sniper-frontend",
            "client_secret": "votre-secret-configuré"
        }
    """
    # Vérification simple (à remplacer par une DB en production)
    # Le secret doit correspondre à API_SECRET_KEY dans .env
    if request.client_secret != settings.API_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Client secret invalide",
        )

    # Déterminer le rôle
    role = "admin" if request.client_id.startswith("ict-sniper") else "viewer"

    token = create_access_token(subject=request.client_id, role=role)
    return TokenResponse(
        access_token=token,
        expires_in=settings.API_TOKEN_EXPIRE_MINUTES * 60,
    )


# ═══════════════════════════════════════════════
# MT5 CONNECTION
# ═══════════════════════════════════════════════

@router.get("/api/mt5/status", response_model=MT5ConnectionStatus, tags=["MT5"])
async def mt5_status(user: dict = Depends(get_current_user)):
    """Statut de la connexion MT5."""
    return MT5ConnectionStatus(
        connected=mt5_engine.is_connected,
        simulation_mode=mt5_engine.simulation_mode,
        account=mt5_engine.get_account_info(),
    )


@router.post("/api/mt5/connect", tags=["MT5"])
async def mt5_connect(
    request: MT5ConnectRequest,
    user: dict = Depends(require_admin),
):
    """
    Connexion au compte MT5.
    ⚠️ Nécessite le rôle "admin".
    """
    result = mt5_engine.connect(
        login=request.login,
        password=request.password,
        server=request.server,
        path=request.path,
    )
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result["message"],
        )
    return result


@router.post("/api/mt5/disconnect", tags=["MT5"])
async def mt5_disconnect(user: dict = Depends(require_admin)):
    """Déconnexion de MT5."""
    mt5_engine.disconnect()
    return {"success": True, "message": "Déconnecté"}


@router.get("/api/mt5/account", response_model=AccountInfo, tags=["MT5"])
async def mt5_account(user: dict = Depends(get_current_user)):
    """Informations du compte MT5."""
    info = mt5_engine.get_account_info()
    if info is None:
        raise HTTPException(status_code=503, detail="MT5 non connecté")
    return info


# ═══════════════════════════════════════════════
# PRIX
# ═══════════════════════════════════════════════

@router.get("/api/prices/{symbol}", response_model=TickData, tags=["Prices"])
async def get_price(
    symbol: str,
    user: dict = Depends(get_current_user),
):
    """
    Prix en temps réel pour un symbole.

    Exemple : GET /api/prices/XAUUSD
    """
    tick = mt5_engine.get_tick(symbol.upper())
    if tick is None:
        raise HTTPException(status_code=404, detail=f"Prix non disponible pour {symbol}")
    return tick


@router.get("/api/prices", tags=["Prices"])
async def get_prices(
    symbols: str = Query("XAUUSD,BTCUSD,EURUSD", description="Symboles séparés par virgule"),
    user: dict = Depends(get_current_user),
):
    """
    Prix en temps réel pour plusieurs symboles.

    Exemple : GET /api/prices?symbols=XAUUSD,BTCUSD,EURUSD
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    result = mt5_engine.get_ticks_multiple(symbol_list)
    return {"prices": result}


@router.get("/api/candles", response_model=List[CandleData], tags=["Prices"])
async def get_candles(
    symbol: str = Query("XAUUSD"),
    timeframe: str = Query("M5", pattern=r"^(M1|M5|M15|H1|H4|D1)$"),
    count: int = Query(100, ge=1, le=1000),
    user: dict = Depends(get_current_user),
):
    """
    Chandeliers japonais.

    Exemple : GET /api/candles?symbol=XAUUSD&timeframe=M5&count=100
    """
    candles = mt5_engine.get_candles(symbol.upper(), timeframe, count)
    return candles


# ═══════════════════════════════════════════════
# ORDRES
# ═══════════════════════════════════════════════

@router.post("/api/orders", response_model=OrderResponse, tags=["Orders"])
async def send_order(
    request: OrderRequest,
    user: dict = Depends(require_admin),
):
    """
    Envoyer un ordre de marché (Market Order).

    ⚠️ Nécessite le rôle "admin".

    Exemple :
        POST /api/orders
        {
            "symbol": "XAUUSD",
            "order_type": "buy",
            "volume": 0.01,
            "sl": 2640.00,
            "tp": 2670.00
        }
    """
    result = mt5_engine.send_order(
        symbol=request.symbol.upper(),
        order_type=request.order_type.lower(),
        volume=request.volume,
        sl=request.sl,
        tp=request.tp,
        deviation=request.deviation,
        comment=request.comment,
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.post("/api/orders/close", tags=["Orders"])
async def close_position(
    request: ClosePositionRequest,
    user: dict = Depends(require_admin),
):
    """Fermer une position par son ticket."""
    result = mt5_engine.close_position(request.ticket)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@router.post("/api/orders/modify", tags=["Orders"])
async def modify_position(
    request: ModifyPositionRequest,
    user: dict = Depends(require_admin),
):
    """Modifier le SL/TP d'une position."""
    if request.sl is None and request.tp is None:
        raise HTTPException(status_code=400, detail="Au moins SL ou TP doit être fourni")
    result = mt5_engine.modify_position(request.ticket, request.sl, request.tp)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# ═══════════════════════════════════════════════
# POSITIONS & HISTORIQUE
# ═══════════════════════════════════════════════

@router.get("/api/positions", response_model=List[PositionInfo], tags=["Positions"])
async def get_positions(user: dict = Depends(get_current_user)):
    """Liste des positions ouvertes."""
    return mt5_engine.get_positions()


@router.get("/api/history", response_model=List[TradeHistoryItem], tags=["Positions"])
async def get_history(
    days: int = Query(7, ge=1, le=90, description="Nombre de jours d'historique"),
    user: dict = Depends(get_current_user),
):
    """Historique des trades fermés."""
    return mt5_engine.get_trade_history(days=days)
