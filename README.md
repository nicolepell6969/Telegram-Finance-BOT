# 💰 Family Finance Bot

AI-powered Telegram bot for family expense tracking with automated insights and multi-user support.

---

## ✨ Features

### 📝 Smart Input Methods
- **Text Input** - Natural language: "makan 50000" → auto-parsed with Gemini AI
- **Voice Input** - Indonesian voice notes → transcribed with Groq Whisper
- **Photo OCR** - Receipt scanning → extracted with Gemini Vision

### 🤖 AI-Powered Analysis
- Indonesian language support
- Auto category detection
- Telco provider recognition (Telkomsel, Indosat, XL, etc.)
- Number format parsing (50rb, 5jt, 100 ribu)

### 📊 Automated Insights
- **Daily Summary** (21:00 WIB) - Quick daily recap
- **Weekly Summary** (Sunday 18:00) - Week trends
- **Monthly Insights** (28th, 20:00) - AI analysis with recommendations

### 👨‍👩‍👧‍👦 Multi-User Support
- Family member management
- Admin controls
- Individual & family reports
- Per-user statistics

### 📈 Reports & Analytics
- Personal spending reports
- Family aggregate reports
- Category breakdown charts
- Monthly/daily summaries
- Visual charts via Google Sheets

---

## 🚀 Quick Start

### Prerequisites
- Telegram account
- VPS with Ubuntu/Debian (or any Linux server)
- Node.js 18+ installed

### Installation

```bash
# 1. Clone or upload project
cd /root
# (upload your project files here)

# 2. Install dependencies
cd finance-bot
npm install

# 3. Setup environment variables
cp .env.example .env
nano .env  # Edit with your API keys

# 4. Start with PM2
npm install -g pm2
pm2 start bot.js --name finance-bot
pm2 save
pm2 startup  # Enable auto-start on reboot

# 5. Check logs
pm2 logs finance-bot
```

---

## 🔄 Automated Git Workflow

**Auto-push script with security checks:**

```bash
# Push changes to GitHub (with API key scanning)
./git-push.sh "Your commit message"

# Or if no message provided, it will prompt you
./git-push.sh
```

**Features:**
- ✅ Auto-scans for exposed API keys
- ✅ Blocks commit if credentials found
- ✅ Pre-commit hook protection
- ✅ One-command push

**Example:**
```bash
./git-push.sh "Add new feature"
# Will automatically:
# 1. Check for API keys
# 2. Git add all changes
# 3. Commit with message
# 4. Push to GitHub
```

---

## 🔑 API Keys Setup

### 1. Telegram Bot Token

**Steps:**
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose bot name (e.g., "My Family Finance Bot")
4. Choose username (e.g., "myfamily_finance_bot")
5. Copy the token: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

**Add to `.env`:**
```env
TELEGRAM_BOT_TOKEN=your_token_here
```

---

### 2. Google Gemini API Key (FREE)

**For:** Text parsing & Photo OCR

**Steps:**
1. Visit: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Select "Create API key in new project" (or existing)
4. Copy the API key: `AIzaSy...`

**Add to `.env`:**
```env
GEMINI_API_KEY=AIzaSy...
```

**Free Tier:** 1,500 requests/day (plenty for family use!)

---

### 3. Groq API Key (FREE)

**For:** Voice transcription (Whisper)

**Steps:**
1. Visit: https://console.groq.com/
2. Sign up with email or Google
3. Go to "API Keys" section
4. Click "Create API Key"
5. Copy the key: `gsk_...`

**Add to `.env`:**
```env
GROQ_API_KEY=gsk_...
```

**Free Tier:** Generous limits for voice transcription

---

### 4. Google Sheets API (FREE)

**For:** Data storage

#### 4.1. Create Google Cloud Project

1. Visit: https://console.cloud.google.com/
2. Create new project: "Finance Bot"
3. Wait for project creation

#### 4.2. Enable Google Sheets API

1. Go to: https://console.cloud.google.com/apis/library
2. Search "Google Sheets API"
3. Click "Enable"

#### 4.3. Create Service Account

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "Create Service Account"
3. Name: "finance-bot-service"
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

#### 4.4. Create Service Account Key

1. Click on the service account email
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Download the file
6. Rename to `service-account-key.json`
7. Upload to `/root/finance-bot/`

**Set in `.env`:**
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

#### 4.5. Create Google Sheet

1. Create new Google Sheet: https://sheets.google.com
2. Name it "Family Finance Tracker"
3. Copy the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
4. Share sheet with service account email (from step 4.3)
   - Click "Share" button
   - Paste service account email
   - Give "Editor" permission

**Add to `.env`:**
```env
GOOGLE_SHEET_ID=your_sheet_id_here
```

---

## 📋 Complete `.env` Example

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE

# Groq AI (Voice)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini (Text + Photo)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Google Sheets
GOOGLE_SHEET_ID=1ABcd-EFgh_IJklMNopQRSTuvwxyz-EXAMPLE-ID
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

---

## 📱 Bot Commands

### For Everyone
```
/start          - Start bot & register
/help           - Show help
/whoami         - Show your info
/expense        - Manual expense entry
/income         - Manual income entry
/myreport       - Your personal report
/mystats        - Your statistics
/settings       - Notification preferences
```

### For Admin Only
```
/members        - List all members
/familyreport   - Family aggregate report
/familystats    - Family statistics
/fixsheet       - Fix Google Sheets format
```

---

## 💬 Usage Examples

### Text Input (Easiest!)
Just type naturally:
```
makan 50000
gaji 5 juta
pulsa telkomsel 50rb
transport 20k
```

Bot auto-detects:
- Type (expense/income)
- Amount (with Indonesian formats)
- Category
- Description

### Voice Input
1. Record voice note
2. Say: "makan lima puluh ribu"
3. Bot transcribes → parses → confirms

### Photo Input
1. Take photo of receipt
2. Send to bot
3. Bot extracts amount, merchant, category

---

## 🔔 Automated Notifications

Configure with `/settings`

### Daily Summary (21:00 WIB)
```
🌙 Rekap Harian - 27 Desember 2025

💰 Total Pengeluaran: Rp 150,000
📝 Transaksi: 8
🏆 Kategori Terbanyak: MAKANAN (Rp 80,000)

💤 Selamat istirahat!
```

### Weekly Summary (Sunday 18:00 WIB)
```
📊 Rekap Mingguan
📅 21 Des - 27 Des

💸 Minggu Ini: Rp 800,000
📈 vs Minggu Lalu: ↑ 12%

🏆 Top 3 Kategori:
1. MAKANAN: Rp 350,000
2. TRANSPORT: Rp 250,000
3. BELANJA: Rp 120,000
```

### Monthly Insights (28th, 20:00 WIB)
```
🎯 Insights Bulanan - Desember 2025

💰 Total: Rp 5,000,000
📊 Transaksi: 157

🎯 Pengeluaran naik 15% dibanding bulan lalu

⚠️ HIBURAN meningkat 45% - perlu dibatasi

💡 Rekomendasi:
• Set budget HIBURAN max Rp 500,000
• MAKANAN relatif stabil, pertahankan!

📊 TAGIHAN turun 20% - bagus! 👍
```

---

## 🏗️ Architecture

```
Telegram Bot
    ↓
┌───────────────────────────────┐
│   Input Processing            │
├───────────────────────────────┤
│ Text   → Gemini 2.5 Flash     │
│ Voice  → Groq Whisper         │
│ Photo  → Gemini Vision        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│   Transaction Validation      │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│   Google Sheets Storage       │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│   Scheduled Jobs (node-cron)  │
│   - Daily 21:00               │
│   - Weekly Sunday 18:00       │
│   - Monthly 28th 20:00        │
└───────────────────────────────┘
```

---

## 📁 Project Structure

```
finance-bot/
├── bot.js                      # Main entry point
├── package.json
├── .env                        # API keys (not in git)
├── service-account-key.json    # Google credentials
├── data/
│   ├── users.json             # User database
│   └── user-settings.json     # Notification preferences
├── src/
│   ├── handlers/              # Input handlers
│   │   ├── textHandler.js
│   │   ├── voiceHandler.js
│   │   └── photoHandler.js
│   ├── gemini/                # Gemini AI client
│   ├── groq/                  # Groq Whisper client
│   ├── sheets/                # Google Sheets client
│   ├── scheduler/             # Automated jobs
│   ├── insights/              # AI insights generator
│   ├── notifications/         # Notification sender
│   ├── users/                 # User management
│   ├── reports/               # Report generators
│   ├── config/                # Configuration
│   └── utils/                 # Utilities
└── downloads/                 # Temp file storage
```

---

## 🔧 Troubleshooting

### Bot Not Responding
```bash
# Check if bot is running
pm2 status

# View logs
pm2 logs finance-bot --err

# Restart bot
pm2 restart finance-bot
```

### "Permission Denied" Errors
```bash
# Check Google Sheets sharing
# Make sure service account has Editor access

# Verify credentials file
ls -la service-account-key.json
```

### Voice Not Working
```bash
# Check Groq API key
cat .env | grep GROQ

# Test Groq connection
node -e "console.log(process.env.GROQ_API_KEY)"
```

### Photo OCR Not Working
```bash
# Check Gemini API key
cat .env | grep GEMINI

# View error logs
pm2 logs finance-bot --err --lines 50
```

---

## 💰 Pricing (All FREE!)

| Service | Free Tier | Usage |
|---------|-----------|-------|
| Telegram Bot API | Unlimited | FREE |
| Google Gemini | 1,500 req/day | Text + Photo |
| Groq Whisper | Generous | Voice transcription |
| Google Sheets API | Unlimited* | Data storage |
| VPS Hosting | Varies | $3-10/month |

**Total API Cost: $0/month** 🎉

*Google Sheets: Free for typical family use (< 10M cells)

---

## 🎯 Categories

### Expense Categories
- MAKANAN - Food & dining
- TRANSPORT - Transportation
- BELANJA - Shopping
- TAGIHAN - Bills (auto-detects telco)
- HIBURAN - Entertainment
- KESEHATAN - Health
- PENDIDIKAN - Education
- PAKAIAN - Clothing
- LAINNYA - Others

### Income Categories
- GAJI - Salary
- FREELANCE - Freelance work
- BISNIS - Business income
- INVESTASI - Investment returns
- HADIAH - Gifts
- LAINNYA - Others

---

## 📊 Reports & Charts

Bot automatically generates:
- Pie charts (category breakdown)
- Bar charts (monthly trends)
- Summary tables
- Spending comparisons

All viewable in Google Sheets with auto-refresh!

---

## 🔐 Security

- API keys in `.env` (not committed to git)
- User authentication required
- Admin-only commands
- Service account credentials isolated
- No sensitive data in logs

---

## 🆘 Support

**Issues?**
1. Check logs: `pm2 logs finance-bot --err`
2. Verify API keys in `.env`
3. Ensure Google Sheets is shared with service account
4. Restart bot: `pm2 restart finance-bot`

**Common Issues:**
- Bot crash → Check syntax errors in logs
- No response → Verify Telegram token
- OCR fail → Check Gemini API key & quota
- Voice fail → Check Groq API key
- Data not saving → Verify Sheets permissions

---

## 📝 License

MIT License - Free to use and modify

---

## 🎉 Ready to Use!

1. ✅ Setup API keys
2. ✅ Configure `.env`
3. ✅ Start bot with PM2
4. ✅ Register with `/start`
5. ✅ Start tracking expenses!

**First user becomes admin automatically** 👑

---

**Made with ❤️ using Google Gemini & Groq Whisper**

**100% Free AI Stack** 🚀
