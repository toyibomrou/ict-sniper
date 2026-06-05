@echo off
REM ─── ICT Sniper Bridge API - Installation Windows ───

echo ============================================
echo   ICT Sniper - MT5 Bridge API Setup
echo ============================================
echo.

REM Vérifier Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe.
    echo Telechargez-le depuis https://www.python.org/downloads/
    echo Assurez-vous de cocher "Add Python to PATH"
    pause
    exit /b 1
)

echo [1/4] Creation de l'environnement virtuel...
python -m venv venv
call venv\Scripts\activate.bat

echo [2/4] Installation des dependances...
pip install -r requirements.txt

echo [3/4] Copie du fichier .env...
if not exist .env (
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Editez le fichier .env avec vos identifiants MT5 !
    echo.
)

echo [4/4] Verification...
python -c "from app.main import app; print('✅ Bridge API OK')"

echo.
echo ============================================
echo   Installation terminee !
echo.
echo   Demarrage en mode simulation:
echo     python run.py
echo.
echo   Demarrage en mode live MT5:
echo     python run.py --live
echo.
echo   Documentation API:
echo     http://localhost:5555/docs
echo ============================================
pause
