#!/bin/bash

# Finance Bot Setup Script
# This script helps you set up the Telegram Finance Bot

echo "🤖 Telegram Finance Bot - Setup Script"
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file and fill in your API keys:"
    echo "   - TELEGRAM_BOT_TOKEN (from @BotFather)"
    echo "   - GROQ_API_KEY (from https://console.groq.com)"
    echo "   - GOOGLE_SHEET_ID (from your Google Sheet URL)"
    echo ""
    echo "Run: nano .env"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if service account key exists
if [ ! -f service-account-key.json ]; then
    echo "⚠️  Google Service Account key not found!"
    echo "   Please download it from Google Cloud Console and save as:"
    echo "   service-account-key.json"
    echo ""
else
    echo "✅ Google Service Account key found"
    echo ""
fi

# Check if downloads directory exists
if [ ! -d downloads ]; then
    echo "📁 Creating downloads directory..."
    mkdir -p downloads
    echo "✅ Downloads directory created"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup Complete! Next steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "2. Make sure you have:"
echo "   ✓ Telegram Bot Token from @BotFather"
echo "   ✓ Groq API Key from https://console.groq.com"
echo "   ✓ Google Sheet ID and Service Account JSON"
echo ""
echo "3. Share your Google Sheet with the service account email"
echo ""
echo "4. Run the bot:"
echo "   npm run dev    # Development mode with auto-reload"
echo "   npm start      # Production mode"
echo ""
echo "5. Open Telegram and chat with your bot!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
