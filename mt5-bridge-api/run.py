"""
Script de démarrage du Bridge API.

Usage :
    python run.py              # Mode simulation (Mac/Linux/Windows)
    python run.py --live       # Mode live MT5 (Windows uniquement)
"""

import uvicorn
import argparse
from app.core.config import settings


def main():
    parser = argparse.ArgumentParser(description="ICT Sniper MT5 Bridge API")
    parser.add_argument("--live", action="store_true", help="Mode live MT5 (Windows uniquement)")
    parser.add_argument("--port", type=int, default=settings.BRIDGE_PORT, help="Port du serveur")
    args = parser.parse_args()

    if args.live:
        from app.services.mt5_engine import mt5_engine
        mt5_engine.simulation_mode = False
        print("🔴 Mode LIVE activé — Connexion MT5 réelle")
    else:
        print("🟢 Mode SIMULATION activé — Pas de connexion MT5 réelle")

    uvicorn.run(
        "app.main:app",
        host=settings.BRIDGE_HOST,
        port=args.port,
        reload=True,
        log_level=settings.BRIDGE_LOG_LEVEL,
    )


if __name__ == "__main__":
    main()
