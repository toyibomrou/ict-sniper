"""
WebSocket pour les prix en temps réel.

Le frontend se connecte ici pour recevoir les ticks en continu
sans avoir à faire du polling (requêtes répétées).

Architecture :
┌──────────────┐     WebSocket      ┌──────────────┐     MT5 API     ┌─────────┐
│   Frontend   │ ←────────────────→ │  Bridge API  │ ─────────────→ │  MT5    │
│  (Vercel)    │   ws://.../ws/prices│  (FastAPI)   │  get_tick()    │ Terminal│
│              │                     │              │                 │         │
│  Reçoit:     │                     │  Toutes les  │                 │         │
│  {"XAUUSD":  │                     │  500ms       │                 │         │
│   {"bid":..} │                     │              │                 │         │
└──────────────┘                     └──────────────┘                 └─────────┘
"""

import asyncio
import json
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger
from app.services.mt5_engine import mt5_engine


class PriceStreamManager:
    """
    Gestionnaire de connexions WebSocket.
    Diffuse les prix en temps réel à tous les clients connectés.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._streaming = False
        self._symbols = ["XAUUSD", "BTCUSD", "EURUSD", "GBPUSD", "USDJPY"]

    async def connect(self, websocket: WebSocket):
        """Accepte une nouvelle connexion WebSocket."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client WebSocket connecté. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Retire une connexion WebSocket."""
        self.active_connections.discard(websocket)
        logger.info(f"Client WebSocket déconnecté. Total: {len(self.active_connections)}")

    async def start_streaming(self):
        """
        Démarre le flux de prix en temps réel.
        Envoie les ticks toutes les 500ms à tous les clients.
        """
        if self._streaming:
            return
        self._streaming = True
        asyncio.create_task(self._stream_loop())

    async def _stream_loop(self):
        """Boucle principale de diffusion des prix."""
        while self._streaming and self.active_connections:
            try:
                # Récupérer les prix pour tous les symboles
                prices = mt5_engine.get_ticks_multiple(self._symbols)

                if prices:
                    message = json.dumps({
                        "type": "ticks",
                        "data": prices,
                    })

                    # Envoyer à tous les clients connectés
                    disconnected = set()
                    for connection in self.active_connections:
                        try:
                            await connection.send_text(message)
                        except Exception:
                            disconnected.add(connection)

                    # Nettoyer les connexions mortes
                    for conn in disconnected:
                        self.disconnect(conn)

                # Fréquence de mise à jour : 500ms
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Erreur dans le stream de prix: {e}")
                await asyncio.sleep(1)

    def stop_streaming(self):
        """Arrête le flux de prix."""
        self._streaming = False


# ─── Instance globale ─────────────────────────
price_manager = PriceStreamManager()


async def websocket_prices(websocket: WebSocket):
    """
    Endpoint WebSocket pour les prix en temps réel.

    Usage côté frontend :
        const ws = new WebSocket('ws://localhost:5555/ws/prices');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // data = { "type": "ticks", "data": { "XAUUSD": { "bid": 2650.5, ... } } }
        };
    """
    await price_manager.connect(websocket)

    # Démarrer le stream si c'est le premier client
    await price_manager.start_streaming()

    try:
        while True:
            # Écouter les messages du client (ex: changement de symboles)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "subscribe":
                    # Le client peut demander des symboles spécifiques
                    symbols = msg.get("symbols", price_manager._symbols)
                    price_manager._symbols = symbols
                    logger.info(f"Symboles mis à jour: {symbols}")
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        price_manager.disconnect(websocket)
        # Arrêter le stream si plus aucun client
        if not price_manager.active_connections:
            price_manager.stop_streaming()
