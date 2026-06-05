"""
Bridge API MT5 — Point d'entrée principal.

Démarrage :
    uvicorn app.main:app --host 0.0.0.0 --port 5555 --reload

Architecture complète :
┌──────────────────────────────────────────────────────────────────┐
│                         BRIDGE API (FastAPI)                     │
│                       Port 5555 • Windows PC                     │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  REST API   │  │  WebSocket  │  │  Middleware  │             │
│  │  /api/*     │  │  /ws/prices │  │  Rate Limit  │             │
│  │             │  │             │  │  CORS        │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
│         │                │                                       │
│  ┌──────┴────────────────┴──────┐                               │
│  │       MT5 Engine             │                               │
│  │  (mt5_engine.py)             │                               │
│  │  • connect / disconnect      │                               │
│  │  • get_tick / get_candles    │                               │
│  │  • send_order / close_pos    │                               │
│  └──────────────┬───────────────┘                               │
│                 │                                                │
│         ┌──────┴──────┐                                         │
│         │  MetaTrader  │                                         │
│         │  5 Terminal  │                                         │
│         └─────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
         ▲                ▲
         │ HTTPS          │ WebSocket
         │                │
┌────────┴────────────────┴────────┐
│       FRONTEND (Next.js)         │
│    Vercel → ict-sniper.vercel.app│
└──────────────────────────────────┘
"""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.core.config import settings
from app.api.routes import router
from app.api.ws import websocket_prices
from app.middleware.rate_limit import RateLimitMiddleware

# ─── Configuration des logs ───────────────────
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | <level>{level:<8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
)
logger.add(
    "bridge_api.log",
    rotation="10 MB",
    retention="7 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function} - {message}",
)

# ─── Création de l'app FastAPI ────────────────
app = FastAPI(
    title="ICT Sniper — MT5 Bridge API",
    description="""
    Bridge API entre le frontend ICT Sniper et MetaTrader 5.

    ## Authentification
    1. Obtenez un token via `POST /auth/token`
    2. Ajoutez `Authorization: Bearer <token>` dans le header de chaque requête

    ## Endpoints
    - **Prices** : Données de marché en temps réel
    - **Orders** : Exécution d'ordres (admin uniquement)
    - **MT5** : Gestion de la connexion au terminal
    - **Positions** : Positions ouvertes et historique
    """,
    version="1.0.0",
    docs_url="/docs",          # Swagger UI
    redoc_url="/redoc",        # ReDoc
)

# ─── CORS Middleware ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Rate Limiting ────────────────────────────
app.add_middleware(RateLimitMiddleware)

# ─── Routes REST ──────────────────────────────
app.include_router(router)

# ─── WebSocket ────────────────────────────────
app.websocket("/ws/prices")(websocket_prices)


# ─── Événements de cycle de vie ───────────────
@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("🚀 ICT Sniper Bridge API démarré")
    logger.info(f"   Mode simulation: {True}")
    logger.info(f"   Port: {settings.BRIDGE_PORT}")
    logger.info(f"   CORS: {settings.cors_origins_list}")
    logger.info(f"   Docs: http://localhost:{settings.BRIDGE_PORT}/docs")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown():
    from app.services.mt5_engine import mt5_engine
    mt5_engine.disconnect()
    logger.info("🛑 Bridge API arrêté")
