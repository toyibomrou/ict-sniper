#!/bin/bash
# ─── ICT Sniper Bridge API - Installation Mac/Linux ───

echo "============================================"
echo "  ICT Sniper - MT5 Bridge API Setup"
echo "============================================"
echo ""

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "[ERREUR] Python3 n'est pas installé."
    exit 1
fi

echo "[1/4] Création de l'environnement virtuel..."
python3 -m venv venv
source venv/bin/activate

echo "[2/4] Installation des dépendances..."
pip install -r requirements.txt

echo "[3/4] Copie du fichier .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Éditez le fichier .env avec vos identifiants MT5 !"
    echo ""
fi

echo "[4/4] Vérification..."
python -c "from app.main import app; print('✅ Bridge API OK')"

echo ""
echo "============================================"
echo "  Installation terminée !"
echo ""
echo "  Démarrage en mode simulation :"
echo    "python run.py"
echo ""
echo "  ⚠️  Mode live MT5 (Windows uniquement) :"
echo    "python run.py --live"
echo ""
echo "  Documentation API :"
echo    "http://localhost:5555/docs"
echo "============================================"
