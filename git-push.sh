#!/bin/bash
# Auto commit and push changes to GitHub
# Usage: ./git-push.sh "commit message"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for API keys in staged files
echo -e "${YELLOW}🔍 Checking for exposed credentials...${NC}"

# Patterns to check
PATTERNS=(
    "AIzaSy[A-Za-z0-9_-]{33}"           # Gemini API key
    "gsk_[A-Za-z0-9]{48,}"               # Groq API key
    "[0-9]{10}:AA[A-Za-z0-9_-]{33}"     # Telegram bot token
    "service-account-key\.json"          # Service account file
)

# Check staged files
FOUND=0
for pattern in "${PATTERNS[@]}"; do
    if git diff --cached | grep -qE "$pattern"; then
        echo -e "${RED}❌ DANGER: Found potential API key/token pattern!${NC}"
        echo -e "${RED}   Pattern: $pattern${NC}"
        FOUND=1
    fi
done

if [ $FOUND -eq 1 ]; then
    echo -e "${RED}🚨 COMMIT ABORTED - Remove sensitive data first!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ No credentials found${NC}"

# Get commit message
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter commit message:${NC}"
    read -r MESSAGE
else
    MESSAGE="$1"
fi

# Git operations
echo -e "${YELLOW}📦 Adding changes...${NC}"
git add -A

echo -e "${YELLOW}💾 Committing...${NC}"
git commit -m "$MESSAGE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
fi

echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
else
    echo -e "${RED}❌ Push failed${NC}"
    exit 1
fi
