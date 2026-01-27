#!/bin/bash
# Aitel Chatbot Quick Start Script

echo "🚀 Starting Aitel Chatbot Setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Setup server
echo ""
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi
cd ..
echo "✅ Server dependencies installed"

# Setup client
echo ""
echo "📦 Installing client dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
cd ..
echo "✅ Client dependencies installed"

# Check .env files
echo ""
echo "🔐 Checking environment variables..."
if [ ! -f "server/.env" ]; then
    echo "⚠️  server/.env not found. Copying from .env.example..."
    cp server/.env.example server/.env
    echo "📝 Please update server/.env with your actual credentials"
fi

if [ ! -f "client/.env" ]; then
    echo "⚠️  client/.env not found. Copying from .env.example..."
    cp client/.env.example client/.env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your Supabase and LLM credentials"
echo "2. Create database tables in Supabase (see README.md)"
echo "3. Start server: cd server && npm start"
echo "4. Start client: cd client && npm start"
echo ""
echo "🌐 Then visit:"
echo "   - http://localhost:3001 (Client app)"
echo "   - http://localhost:3001/team/support (Support dashboard)"
echo "   - http://localhost:3001/team/sales (Sales dashboard)"
echo "   - http://localhost:3001/team/engineers (Engineering dashboard)"
