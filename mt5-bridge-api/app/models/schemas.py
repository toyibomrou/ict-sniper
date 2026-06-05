"""
Modèles Pydantic pour la validation des requêtes et réponses.

Chaque modèle définit exactement ce que l'API accepte et retourne.
Cela garantit la sécurité (pas de champs inattendus) et documente l'API.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ═══════════════════════════════════════════════
# AUTHENTIFICATION
# ═══════════════════════════════════════════════

class TokenRequest(BaseModel):
    """Requête pour obtenir un JWT."""
    client_id: str = Field(..., min_length=1, description="Identifiant du client")
    client_secret: str = Field(..., min_length=1, description="Secret du client")


class TokenResponse(BaseModel):
    """Réponse avec le JWT."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # secondes


# ═══════════════════════════════════════════════
# CONNEXION MT5
# ═══════════════════════════════════════════════

class MT5ConnectRequest(BaseModel):
    """Paramètres de connexion au compte MT5."""
    login: int = Field(..., description="Numéro de compte MT5")
    password: str = Field(..., min_length=1, description="Mot de passe MT5")
    server: str = Field(..., min_length=1, description="Nom du serveur broker")
    path: Optional[str] = Field(None, description="Chemin vers terminal64.exe")


class MT5ConnectionStatus(BaseModel):
    """Statut de la connexion MT5."""
    connected: bool
    simulation_mode: bool
    account: Optional[dict] = None


# ═══════════════════════════════════════════════
# PRIX
# ═══════════════════════════════════════════════

class TickData(BaseModel):
    """Données de prix en temps réel."""
    symbol: str
    bid: float
    ask: float
    spread: float
    timestamp: str
    last: Optional[float] = None
    volume: Optional[int] = None


class CandleData(BaseModel):
    """Données de chandelier."""
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class CandlesRequest(BaseModel):
    """Requête pour les chandeliers."""
    symbol: str
    timeframe: str = Field("M5", pattern=r"^(M1|M5|M15|H1|H4|D1)$")
    count: int = Field(100, ge=1, le=1000)


# ═══════════════════════════════════════════════
# ORDRES
# ═══════════════════════════════════════════════

class OrderRequest(BaseModel):
    """
    Requête d'ordre de trading.

    Exemple:
        {
            "symbol": "XAUUSD",
            "order_type": "buy",
            "volume": 0.01,
            "sl": 2640.00,
            "tp": 2670.00
        }
    """
    symbol: str = Field(..., min_length=1, description="Symbole (ex: XAUUSD)")
    order_type: str = Field(..., pattern=r"^(buy|sell)$", description="Direction: buy ou sell")
    volume: float = Field(..., gt=0, description="Taille du lot (ex: 0.01)")
    sl: Optional[float] = Field(None, description="Prix du Stop Loss")
    tp: Optional[float] = Field(None, description="Prix du Take Profit")
    deviation: int = Field(20, ge=1, le=100, description="Déviation max en points")
    comment: str = Field("ICT Sniper", max_length=50, description="Commentaire")


class OrderResponse(BaseModel):
    """Réponse après exécution d'un ordre."""
    success: bool
    ticket: Optional[int] = None
    message: str
    price: Optional[float] = None
    volume: Optional[float] = None


class ClosePositionRequest(BaseModel):
    """Requête de fermeture de position."""
    ticket: int = Field(..., description="Numéro de ticket de la position")


class ModifyPositionRequest(BaseModel):
    """Requête de modification de SL/TP."""
    ticket: int
    sl: Optional[float] = None
    tp: Optional[float] = None


# ═══════════════════════════════════════════════
# COMPTE & POSITIONS
# ═══════════════════════════════════════════════

class AccountInfo(BaseModel):
    """Informations du compte MT5."""
    login: int
    server: str
    balance: float
    equity: float
    leverage: int
    currency: str
    margin_free: float
    margin_used: Optional[float] = None
    profit: Optional[float] = None


class PositionInfo(BaseModel):
    """Information sur une position ouverte."""
    ticket: int
    symbol: str
    type: str
    volume: float
    price_open: float
    price_current: float
    sl: Optional[float] = None
    tp: Optional[float] = None
    profit: float
    comment: Optional[str] = None
    time: str


class TradeHistoryItem(BaseModel):
    """Item de l'historique des trades."""
    ticket: int
    symbol: str
    type: str
    volume: float
    price: float
    profit: float
    time: str


# ═══════════════════════════════════════════════
# SANTÉ
# ═══════════════════════════════════════════════

class HealthResponse(BaseModel):
    """Réponse du health check."""
    status: str
    mt5_connected: bool
    simulation_mode: bool
    uptime_seconds: float
