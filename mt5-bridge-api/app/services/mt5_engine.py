"""
Moteur MT5 — Interface avec MetaTrader 5.

Ce module est le SEUL endroit où on appelle les fonctions MetaTrader5.
Tout le reste de l'application passe par cette classe.

Flow de connexion :
1. mt5.initialize() → Connexion au terminal MT5
2. mt5.login() → Authentification au compte broker
3. mt5.copy_rates_from_pos() → Récupération des prix
4. mt5.order_send() → Envoi d'ordres

⚠️ IMPORTANT : Ce code tourne UNIQUEMENT sur Windows (MT5 est Windows-only).
   Pour le développement sur Mac/Linux, utiliser le mode SIMULATION.
"""

import MetaTrader5 as mt5
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
import numpy as np
import time


class MT5Engine:
    """
    Moteur de trading MT5.
    Gère la connexion, la récupération de données et l'exécution d'ordres.
    """

    # ─── Mapping symboles → configurations MT5 ───
    SYMBOL_CONFIG = {
        "XAUUSD": {"digits": 2, "point": 0.01, "volume_min": 0.01, "volume_step": 0.01},
        "BTCUSD": {"digits": 2, "point": 0.01, "volume_min": 0.01, "volume_step": 0.01},
        "EURUSD": {"digits": 5, "point": 0.00001, "volume_min": 0.01, "volume_step": 0.01},
        "GBPUSD": {"digits": 5, "point": 0.00001, "volume_min": 0.01, "volume_step": 0.01},
        "USDJPY": {"digits": 3, "point": 0.001, "volume_min": 0.01, "volume_step": 0.01},
    }

    def __init__(self, simulation_mode: bool = False):
        self.simulation_mode = simulation_mode
        self._connected = False
        self._account_info = None
        self._positions = []
        self._simulated_prices = {
            "XAUUSD": 2650.50,
            "BTCUSD": 97500.00,
            "EURUSD": 1.08750,
            "GBPUSD": 1.27120,
            "USDJPY": 157.850,
        }

    # ═══════════════════════════════════════════
    # CONNEXION
    # ═══════════════════════════════════════════

    def connect(
        self,
        login: int,
        password: str,
        server: str,
        path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Connexion au terminal MT5.

        Args:
            login: Numéro de compte MT5
            password: Mot de passe MT5
            server: Nom du serveur broker
            path: Chemin vers terminal64.exe (optionnel)

        Returns:
            {"success": bool, "message": str, "account": dict|None}
        """
        if self.simulation_mode:
            self._connected = True
            self._account_info = {
                "login": login,
                "server": server,
                "balance": 10000.00,
                "equity": 10050.25,
                "leverage": 100,
                "currency": "USD",
                "margin_free": 9500.00,
            }
            logger.info(f"[SIMULATION] Connecté au compte {login}@{server}")
            return {"success": True, "message": "Connecté (mode simulation)", "account": self._account_info}

        try:
            # Initialiser MT5
            init_kwargs = {}
            if path:
                init_kwargs["path"] = path

            if not mt5.initialize(**init_kwargs):
                error = mt5.last_error()
                logger.error(f"MT5 initialize() échoué: {error}")
                return {"success": False, "message": f"MT5 initialization échouée: {error}", "account": None}

            # Login au compte
            if not mt5.login(login, password, server):
                error = mt5.last_error()
                mt5.shutdown()
                logger.error(f"MT5 login() échoué: {error}")
                return {"success": False, "message": f"Login échoué: {error}", "account": None}

            self._connected = True
            self._account_info = self._get_account_info()
            logger.info(f"Connecté au compte MT5 {login}@{server}")
            return {"success": True, "message": "Connecté avec succès", "account": self._account_info}

        except Exception as e:
            logger.error(f"Erreur connexion MT5: {e}")
            return {"success": False, "message": str(e), "account": None}

    def disconnect(self) -> None:
        """Déconnexion propre de MT5."""
        if self.simulation_mode:
            self._connected = False
            logger.info("[SIMULATION] Déconnecté")
            return

        if self._connected:
            mt5.shutdown()
            self._connected = False
            logger.info("Déconnecté de MT5")

    @property
    def is_connected(self) -> bool:
        return self._connected

    # ═══════════════════════════════════════════
    # DONNÉES DE PRIX
    # ═══════════════════════════════════════════

    def get_tick(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Récupère le dernier tick (prix en temps réel) pour un symbole.

        Returns:
            {
                "symbol": "XAUUSD",
                "bid": 2650.50,
                "ask": 2650.80,
                "spread": 0.30,
                "timestamp": "2026-06-04T14:30:00",
                "last": 2650.65,
                "volume": 12345,
            }
        """
        if self.simulation_mode:
            return self._simulate_tick(symbol)

        if not self._connected:
            logger.warning("MT5 non connecté")
            return None

        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            logger.warning(f"Pas de tick pour {symbol}")
            return None

        config = self.SYMBOL_CONFIG.get(symbol, {"digits": 5})
        spread = round((tick.ask - tick.bid) / self._get_point(symbol), config["digits"])

        return {
            "symbol": symbol,
            "bid": round(tick.bid, config["digits"]),
            "ask": round(tick.ask, config["digits"]),
            "spread": spread,
            "timestamp": datetime.fromtimestamp(tick.time).isoformat(),
            "last": round(tick.last, config["digits"]) if tick.last else None,
            "volume": tick.volume,
        }

    def get_ticks_multiple(self, symbols: List[str]) -> Dict[str, Dict]:
        """Récupère les ticks pour plusieurs symboles en une seule fois."""
        result = {}
        for symbol in symbols:
            tick = self.get_tick(symbol)
            if tick:
                result[symbol] = tick
        return result

    def get_candles(
        self,
        symbol: str,
        timeframe: str = "M5",
        count: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Récupère les chandeliers japonais pour un symbole.

        Args:
            symbol: "XAUUSD", "BTCUSD", etc.
            timeframe: "M1", "M5", "M15", "H1", "H4", "D1"
            count: Nombre de chandeliers (max 1000)

        Returns:
            Liste de {"time", "open", "high", "low", "close", "volume"}
        """
        if self.simulation_mode:
            return self._simulate_candles(symbol, count)

        if not self._connected:
            return []

        tf_map = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
        }
        mt5_tf = tf_map.get(timeframe, mt5.TIMEFRAME_M5)

        rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, count)
        if rates is None:
            return []

        config = self.SYMBOL_CONFIG.get(symbol, {"digits": 5})
        candles = []
        for r in rates:
            candles.append({
                "time": datetime.fromtimestamp(r["time"]).isoformat(),
                "open": round(float(r["open"]), config["digits"]),
                "high": round(float(r["high"]), config["digits"]),
                "low": round(float(r["low"]), config["digits"]),
                "close": round(float(r["close"]), config["digits"]),
                "volume": int(r["tick_volume"]),
            })
        return candles

    # ═══════════════════════════════════════════
    # EXÉCUTION D'ORDRES
    # ═══════════════════════════════════════════

    def send_order(
        self,
        symbol: str,
        order_type: str,  # "buy" ou "sell"
        volume: float,
        sl: Optional[float] = None,
        tp: Optional[float] = None,
        deviation: int = 20,
        comment: str = "ICT Sniper",
    ) -> Dict[str, Any]:
        """
        Envoie un ordre de marché (Market Order) vers MT5.

        Args:
            symbol: "XAUUSD", "BTCUSD", etc.
            order_type: "buy" ou "sell"
            volume: Taille du lot (ex: 0.01)
            sl: Prix du Stop Loss (optionnel)
            tp: Prix du Take Profit (optionnel)
            deviation: Déviation maximale en points
            comment: Commentaire visible dans MT5

        Returns:
            {"success": bool, "ticket": int, "message": str}
        """
        if self.simulation_mode:
            return self._simulate_order(symbol, order_type, volume, sl, tp)

        if not self._connected:
            return {"success": False, "ticket": None, "message": "MT5 non connecté"}

        # Vérifier que le symbole est disponible
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            return {"success": False, "ticket": None, "message": f"Symbole {symbol} non trouvé"}

        # Activer le symbole si nécessaire
        if not symbol_info.visible:
            mt5.symbol_select(symbol, True)

        # Déterminer le type d'ordre MT5
        type_map = {
            "buy": mt5.ORDER_TYPE_BUY,
            "sell": mt5.ORDER_TYPE_SELL,
        }
        mt5_order_type = type_map.get(order_type.lower())
        if mt5_order_type is None:
            return {"success": False, "ticket": None, "message": f"Type d'ordre invalide: {order_type}"}

        # Prix actuel
        tick = mt5.symbol_info_tick(symbol)
        price = tick.ask if mt5_order_type == mt5.ORDER_TYPE_BUY else tick.bid

        # Construction de la requête
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": mt5_order_type,
            "price": price,
            "deviation": deviation,
            "magic": 20240604,  # Magic number ICT Sniper
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        # Ajouter SL/TP si fournis
        if sl is not None:
            request["sl"] = sl
        if tp is not None:
            request["tp"] = tp

        # Envoyer l'ordre
        result = mt5.order_send(request)

        if result is None:
            error = mt5.last_error()
            logger.error(f"order_send() retourné None: {error}")
            return {"success": False, "ticket": None, "message": f"Erreur: {error}"}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(f"Ordre échoué: retcode={result.retcode}, comment={result.comment}")
            return {"success": False, "ticket": None, "message": f"Ordre échoué: {result.comment}"}

        logger.info(f"Ordre exécuté: {order_type} {volume} {symbol} → ticket #{result.order}")
        return {
            "success": True,
            "ticket": result.order,
            "message": f"Ordre exécuté: {order_type} {volume} {symbol}",
            "price": result.price,
            "volume": result.volume,
        }

    def close_position(self, ticket: int) -> Dict[str, Any]:
        """Ferme une position par son ticket."""
        if self.simulation_mode:
            logger.info(f"[SIMULATION] Position #{ticket} fermée")
            return {"success": True, "message": f"Position #{ticket} fermée (simulation)"}

        if not self._connected:
            return {"success": False, "message": "MT5 non connecté"}

        position = mt5.positions_get(ticket=ticket)
        if not position:
            return {"success": False, "message": f"Position #{ticket} non trouvée"}

        pos = position[0]
        close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        tick = mt5.symbol_info_tick(pos.symbol)
        price = tick.bid if close_type == mt5.ORDER_TYPE_SELL else tick.ask

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": pos.symbol,
            "volume": pos.volume,
            "type": close_type,
            "position": ticket,
            "price": price,
            "deviation": 20,
            "magic": 20240604,
            "comment": "ICT Sniper Close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
            return {"success": False, "message": f"Échec fermeture: {result.comment if result else 'Unknown'}"}

        return {"success": True, "message": f"Position #{ticket} fermée"}

    def modify_position(
        self,
        ticket: int,
        sl: Optional[float] = None,
        tp: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Modifie le SL/TP d'une position."""
        if self.simulation_mode:
            return {"success": True, "message": f"Position #{ticket} modifiée (simulation)"}

        if not self._connected:
            return {"success": False, "message": "MT5 non connecté"}

        position = mt5.positions_get(ticket=ticket)
        if not position:
            return {"success": False, "message": f"Position #{ticket} non trouvée"}

        pos = position[0]
        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "symbol": pos.symbol,
            "position": ticket,
            "sl": sl if sl is not None else pos.sl,
            "tp": tp if tp is not None else pos.tp,
        }

        result = mt5.order_send(request)
        if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
            return {"success": False, "message": f"Échec modification: {result.comment if result else 'Unknown'}"}

        return {"success": True, "message": f"Position #{ticket} modifiée"}

    # ═══════════════════════════════════════════
    # INFORMATIONS DE COMPTE
    # ═══════════════════════════════════════════

    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Récupère les informations du compte MT5."""
        if self.simulation_mode:
            return self._account_info

        if not self._connected:
            return None

        return self._get_account_info()

    def get_positions(self) -> List[Dict[str, Any]]:
        """Récupère toutes les positions ouvertes."""
        if self.simulation_mode:
            return self._positions

        if not self._connected:
            return []

        positions = mt5.positions_get()
        if positions is None:
            return []

        result = []
        for pos in positions:
            result.append({
                "ticket": pos.ticket,
                "symbol": pos.symbol,
                "type": "buy" if pos.type == mt5.ORDER_TYPE_BUY else "sell",
                "volume": pos.volume,
                "price_open": pos.price_open,
                "price_current": pos.price_current,
                "sl": pos.sl,
                "tp": pos.tp,
                "profit": pos.profit,
                "comment": pos.comment,
                "time": datetime.fromtimestamp(pos.time).isoformat(),
            })
        return result

    def get_trade_history(self, days: int = 7) -> List[Dict[str, Any]]:
        """Récupère l'historique des trades."""
        if self.simulation_mode:
            return []

        if not self._connected:
            return []

        from_date = datetime.now() - timedelta(days=days)
        to_date = datetime.now()
        deals = mt5.history_deals_get(from_date, to_date)

        if deals is None:
            return []

        result = []
        for deal in deals:
            if deal.entry != mt5.DEAL_ENTRY_OUT:  # Seulement les trades fermés
                continue
            result.append({
                "ticket": deal.ticket,
                "symbol": deal.symbol,
                "type": "buy" if deal.type == mt5.DEAL_TYPE_BUY else "sell",
                "volume": deal.volume,
                "price": deal.price,
                "profit": deal.profit,
                "time": datetime.fromtimestamp(deal.time).isoformat(),
            })
        return result

    # ═══════════════════════════════════════════
    # MÉTHODES PRIVÉES
    # ═══════════════════════════════════════════

    def _get_account_info(self) -> Dict[str, Any]:
        """Récupère les infos du compte MT5 (réel)."""
        info = mt5.account_info()
        if info is None:
            return {}

        return {
            "login": info.login,
            "server": info.server,
            "balance": info.balance,
            "equity": info.equity,
            "leverage": info.leverage,
            "currency": info.currency,
            "margin_free": info.margin_free,
            "margin_used": info.margin,
            "profit": info.profit,
        }

    def _get_point(self, symbol: str) -> float:
        """Récupère la valeur d'un point pour un symbole."""
        config = self.SYMBOL_CONFIG.get(symbol)
        if config:
            return config["point"]

        if not self.simulation_mode:
            info = mt5.symbol_info(symbol)
            if info:
                return info.point

        return 0.00001

    def _simulate_tick(self, symbol: str) -> Dict[str, Any]:
        """Génère un tick simulé avec de petites variations."""
        import random

        base_price = self._simulated_prices.get(symbol, 1.0)
        is_jpy = "JPY" in symbol
        is_xau = "XAU" in symbol or "XAU" in symbol
        is_btc = "BTC" in symbol

        if is_xau:
            noise = random.uniform(-0.5, 0.5)
            spread_val = random.uniform(0.20, 0.50)
        elif is_btc:
            noise = random.uniform(-50, 50)
            spread_val = random.uniform(20, 50)
        elif is_jpy:
            noise = random.uniform(-0.05, 0.05)
            spread_val = 0.02
        else:
            noise = random.uniform(-0.0003, 0.0003)
            spread_val = 0.0002

        bid = base_price + noise
        ask = bid + spread_val
        self._simulated_prices[symbol] = bid

        config = self.SYMBOL_CONFIG.get(symbol, {"digits": 5, "point": 0.00001})
        spread_points = round(spread_val / config["point"], config["digits"])

        return {
            "symbol": symbol,
            "bid": round(bid, config["digits"]),
            "ask": round(ask, config["digits"]),
            "spread": spread_points,
            "timestamp": datetime.now().isoformat(),
            "last": round(bid, config["digits"]),
            "volume": random.randint(100, 9999),
        }

    def _simulate_candles(self, symbol: str, count: int) -> List[Dict]:
        """Génère des chandeliers simulés."""
        import random

        config = self.SYMBOL_CONFIG.get(symbol, {"digits": 5})
        base = self._simulated_prices.get(symbol, 1.0)
        candles = []

        for i in range(count):
            is_xau = "XAU" in symbol
            is_btc = "BTC" in symbol
            volatility = 1.0 if is_xau else (50.0 if is_btc else 0.0005)

            open_p = base + random.uniform(-volatility, volatility)
            close_p = open_p + random.uniform(-volatility, volatility)
            high_p = max(open_p, close_p) + random.uniform(0, volatility * 0.5)
            low_p = min(open_p, close_p) - random.uniform(0, volatility * 0.5)

            candles.append({
                "time": (datetime.now() - timedelta(minutes=5 * (count - i))).isoformat(),
                "open": round(open_p, config["digits"]),
                "high": round(high_p, config["digits"]),
                "low": round(low_p, config["digits"]),
                "close": round(close_p, config["digits"]),
                "volume": random.randint(10, 5000),
            })

        return candles

    def _simulate_order(
        self,
        symbol: str,
        order_type: str,
        volume: float,
        sl: Optional[float],
        tp: Optional[float],
    ) -> Dict[str, Any]:
        """Simule l'exécution d'un ordre."""
        import random

        ticket = random.randint(100000, 999999)
        tick = self.get_tick(symbol)
        price = tick["ask"] if order_type == "buy" else tick["bid"]

        self._positions.append({
            "ticket": ticket,
            "symbol": symbol,
            "type": order_type,
            "volume": volume,
            "price_open": price,
            "price_current": price,
            "sl": sl,
            "tp": tp,
            "profit": 0.0,
            "comment": "ICT Sniper",
            "time": datetime.now().isoformat(),
        })

        logger.info(f"[SIMULATION] Ordre exécuté: {order_type} {volume} {symbol} → ticket #{ticket}")
        return {
            "success": True,
            "ticket": ticket,
            "message": f"Ordre exécuté (simulation): {order_type} {volume} {symbol}",
            "price": price,
            "volume": volume,
        }


# ─── Singleton Instance ───────────────────────
# Instance globale partagée dans toute l'application
mt5_engine = MT5Engine(simulation_mode=True)
