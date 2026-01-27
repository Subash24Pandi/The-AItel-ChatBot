@echo off
REM Aitel Chatbot Quick Start Script for Windows

echo.
echo 🚀 Starting Aitel Chatbot Setup...
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 14+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

REM Setup server
echo.
echo 📦 Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Server dependencies installed

REM Setup client
echo.
echo 📦 Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)
cd ..
echo ✅ Client dependencies installed

REM Check .env files
echo.
echo 🔐 Checking environment variables...
if not exist "server\.env" (
    echo ⚠️  server\.env not found. Copying from .env.example...
    copy server\.env.example server\.env
    echo 📝 Please update server\.env with your actual credentials
)

if not exist "client\.env" (
    echo ⚠️  client\.env not found. Copying from .env.example...
    copy client\.env.example client\.env
)

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update server\.env with your Supabase and LLM credentials
echo 2. Create database tables in Supabase (see README.md)
echo 3. Start server: cd server ^&^& npm start
echo 4. Start client (new terminal): cd client ^&^& npm start
echo.
echo 🌐 Then visit:
echo    - http://localhost:3001 (Client app)
echo    - http://localhost:3001/team/support (Support dashboard)
echo    - http://localhost:3001/team/sales (Sales dashboard)
echo    - http://localhost:3001/team/engineers (Engineering dashboard)
echo.
pause
