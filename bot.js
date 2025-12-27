require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const GoogleSheetsClient = require('./src/sheets/client');
const { handleTextInput, handleCallback } = require('./src/handlers/textHandler');
const { handlePhoto } = require('./src/handlers/photoHandler');
const { handleVoiceMessage } = require('./src/handlers/voiceHandler');
const { generateDailyReport, generateCurrentMonthReport } = require('./src/reports/generator');
const {
    generateUserDailyReport,
    generateUserMonthlyReport,
    generateFamilyDailyReport,
    generateFamilyMonthlyReport
} = require('./src/reports/userReports');
const { getCategoryOptions } = require('./src/config/categories');
const userManager = require('./src/users/manager');
const { requireAuth, requireAdmin } = require('./src/middleware/auth');
const { recreateSummarySheet } = require('./src/sheets/recreate');
const { initializeScheduler } = require('./src/scheduler');

// Validate environment variables
const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'GROQ_API_KEY', 'GOOGLE_SHEET_ID'];
const missing = requiredEnvVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please copy .env.example to .env and fill in the values');
    process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Initialize Google Sheets
const sheetsClient = new GoogleSheetsClient();

console.log('🤖 Bot started successfully!');

// Initialize Google Sheet on startup
sheetsClient.initializeSheet()
    .then(() => {
        console.log('📊 Google Sheet ready');

        // Initialize scheduler after sheets are ready
        initializeScheduler(bot, sheetsClient);
    })
    .catch(err => console.error('❌ Failed to initialize Google Sheet:', err));

// ============================================================================
// USER MANAGEMENT COMMANDS
// ============================================================================

/**
 * /register - Register as new user
 */
bot.onText(/\/register\s*(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const inputName = match[1].trim();
    const telegramName = msg.from.first_name || 'User';
    const userName = inputName || telegramName;

    try {
        const result = userManager.registerUser(userId, userName);

        if (!result.success) {
            return bot.sendMessage(chatId, `❌ ${result.message}`);
        }

        if (result.isFirstUser) {
            bot.sendMessage(
                chatId,
                `🎉 Selamat datang, ${userName}!\n\n` +
                `👑 Anda adalah user pertama dan otomatis menjadi *Admin*.\n\n` +
                `Sebagai admin, Anda bisa:\n` +
                `• Menambah member: /addmember\n` +
                `• Hapus member: /removemember\n` +
                `• Lihat semua member: /members\n\n` +
                ` Mulai catat keuangan sekarang! Kirim: "makan 50000"`,
                { parse_mode: 'Markdown' }
            );
        } else {
            bot.sendMessage(
                chatId,
                `✅ Berhasil terdaftar sebagai: *${userName}*\n\n` +
                `Anda sekarang bisa mulai mencatat keuangan!\n\n` +
                `Coba kirim: "makan 50000"`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        console.error('Error registering user:', error);
        bot.sendMessage(chatId, '❌ Gagal mendaftar. Silakan coba lagi.');
    }
});

/**
 * /members - List all members
 */
bot.onText(/\/members/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    try {
        const users = userManager.getUsers();

        if (users.length === 0) {
            return bot.sendMessage(chatId, 'Belum ada member terdaftar.');
        }

        let message = `👥 *Daftar Member (${users.length})*\n\n`;

        users.forEach((user, index) => {
            const roleIcon = user.role === 'admin' ? '👑' : '👤';
            const joinDate = new Date(user.joinedAt).toLocaleDateString('id-ID');
            message += `${index + 1}. ${roleIcon} *${user.name}*\n`;
            message += `   Bergabung: ${joinDate}\n\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error listing members:', error);
        bot.sendMessage(chatId, '❌ Gagal mengambil daftar member.');
    }
});

/**
 * /whoami - Check user status
 */
bot.onText(/\/whoami/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!await requireAuth(bot, msg)) return;

    const user = userManager.getUser(userId);

    bot.sendMessage(
        chatId,
        `👤 *Info Anda*\n\n` +
        `Nama: ${user.name}\n` +
        `Role: ${user.role === 'admin' ? '👑 Admin' : '👤 Member'}\n` +
        `Bergabung: ${new Date(user.joinedAt).toLocaleDateString('id-ID')}`,
        { parse_mode: 'Markdown' }
    );
});

/**
 * /addmember - Admin: Add new member (future: use invite link)
 */
bot.onText(/\/addmember/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;
    if (!await requireAdmin(bot, msg)) return;

    bot.sendMessage(
        chatId,
        `👥 *Cara Menambah Member:*\n\n` +
        `1. Minta member baru kirim /register ke bot ini\n` +
        `2. Mereka akan otomatis terdaftar\n\n` +
        `Lihat semua member dengan /members`,
        { parse_mode: 'Markdown' }
    );
});

/**
 * /removemember - Admin: Remove member
 */
bot.onText(/\/removemember/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!await requireAuth(bot, msg)) return;
    if (!await requireAdmin(bot, msg)) return;

    const users = userManager.getUsers().filter(u => u.userId !== String(userId));

    if (users.length === 0) {
        return bot.sendMessage(chatId, 'Tidak ada member lain yang bisa dihapus.');
    }

    // Create inline keyboard with users
    const keyboard = users.map(user => [{
        text: `${user.name}`,
        callback_data: `remove_user_${user.userId}`
    }]);

    keyboard.push([{ text: '❌ Batal', callback_data: 'cancel' }]);

    bot.sendMessage(
        chatId,
        '👥 Pilih member yang ingin dihapus:',
        {
            reply_markup: {
                inline_keyboard: keyboard
            }
        }
    );
});

// ============================================================================
// FINANCE COMMANDS (with auth check)
// ============================================================================

/**
 * /start - Welcome message
 */
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    const isRegistered = userManager.isAuthorized(msg.from.id);

    const welcomeMessage = isRegistered
        ? `👋 Selamat datang kembali, *${userManager.getUserName(msg.from.id)}*!\n\n` +
        `✨ *Cara Pakai (MUDAH!)*\n\n` +
        `Langsung ketik aja, tanpa command:\n` +
        `• "makan 50000"\n` +
        `• "belanja mingguan 200000"\n` +
        `• "gaji 5 juta"\n\n` +
        `Atau kirim:\n` +
        `📸 Foto struk belanja\n` +
        `🎤 Voice note: "pengeluaran parkir lima ribu"\n\n` +
        `*Commands (opsional):*\n` +
        `/myreport - Laporan pribadi harian\n` +
        `/mystats - Statistik pribadi bulanan\n` +
        `/familyreport - Laporan keluarga\n` +
        `/members - Lihat semua member\n` +
        `/help - Bantuan lengkap\n\n` +
        `🚀 Langsung input sekarang!`
        : `👋 Halo ${userName}!\n\n` +
        `Selamat datang di *Finance Bot* untuk keluarga!\n\n` +
        `🚀 Untuk mulai, daftar dulu dengan:\n` +
        `/register [nama Anda]\n\n` +
        `Contoh: /register Papa\n\n` +
        `${userManager.getUserCount() === 0 ? '👑 Anda akan menjadi admin!' : ''}`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

/**
 * /help - Help message
 */
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    const helpMessage = `
📚 *Panduan Finance Bot*

✨ *CARA MUDAH - Langsung Input!*

💬 *Ketik Langsung (TANPA COMMAND):*
   • "makan 50000"
   • "belanja mingguan 200000"
   • "bensin 100rb"
   • "gaji 5 juta"

📸 *Kirim Foto Struk:*
   Bot otomatis baca total & merchant

🎤 *Voice Note:*
   "pengeluaran parkir lima ribu"
   "pemasukan freelance dua juta"

━━━━━━━━━━━━━━━━━━━━

📊 *Commands untuk Laporan:*
/myreport - Laporan pribadi harian + chart
/mystats - Statistik pribadi bulanan + chart
/familyreport - Laporan keluarga harian
/familystats - Statistik keluarga bulanan

👥 *User Management:*
/members - Lihat semua member
/whoami - Info Anda
/sheet - Link Google Sheet

━━━━━━━━━━━━━━━━━━━━

💡 *Tips:*
✅ TIDAK perlu /expense atau /income
✅ Langsung ketik aja!
✅ Kategori otomatis terdeteksi
✅ Semua data ke Google Sheet
  `.trim();

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

/**
 * /settings - Manage notification preferences
 */
bot.onText(/\/settings/, async (msg) => {
    if (!await requireAuth(bot, msg)) return;

    const chatId = msg.chat.id;
    const userId = String(msg.from.id);
    const { getUserPreferences } = require('./src/notifications/sender');

    const prefs = getUserPreferences(userId);

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: `${prefs.daily ? '✅' : '☑️'} Daily Summary (21:00)`,
                    callback_data: 'settings_daily'
                }
            ],
            [
                {
                    text: `${prefs.weekly ? '✅' : '☑️'} Weekly Summary (Sunday 18:00)`,
                    callback_data: 'settings_weekly'
                }
            ],
            [
                {
                    text: `${prefs.monthly ? '✅' : '☑️'} Monthly Insights (Last day 20:00)`,
                    callback_data: 'settings_monthly'
                }
            ]
        ]
    };

    bot.sendMessage(chatId, `
🔔 *Notification Settings*

Toggle your automated notifications:
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

/**
 * /expense - Manual expense input
 */
bot.onText(/\/expense(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    const input = match[1].trim();

    if (input) {
        return handleTextInput(bot, { ...msg, text: input }, sheetsClient);
    }

    bot.sendMessage(
        chatId,
        '💸 *Catat Pengeluaran*\n\n' +
        'Kirim: /expense [deskripsi] [jumlah]\n\n' +
        'Contoh:\n' +
        '• /expense makan 50000\n' +
        'Atau langsung: "makan 50000"',
        { parse_mode: 'Markdown' }
    );
});

/**
 * /income - Manual income input
 */
bot.onText(/\/income(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    const input = match[1].trim();

    if (input) {
        return handleTextInput(bot, { ...msg, text: input }, sheetsClient);
    }

    bot.sendMessage(
        chatId,
        '💰 *Catat Pemasukan*\n\n' +
        'Kirim: /income [deskripsi] [jumlah]\n\n' +
        'Contoh:\n' +
        '• /income gaji 5000000',
        { parse_mode: 'Markdown' }
    );
});

/**
 * /myreport - Personal daily report
 */
bot.onText(/\/myreport/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    try {
        await bot.sendChatAction(chatId, 'typing');

        const userId = msg.from.id;
        const reportMsg = await generateUserDailyReport(sheetsClient, userId, new Date(), bot, chatId);
        bot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error generating report:', error);
        bot.sendMessage(chatId, '❌ Gagal membuat laporan: ' + error.message);
    }
});

/**
 * /mystats - Personal monthly stats
 */
bot.onText(/\/mystats/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    try {
        await bot.sendChatAction(chatId, 'typing');

        const userId = msg.from.id;
        const now = new Date();
        const reportMsg = await generateUserMonthlyReport(
            sheetsClient,
            userId,
            now.getMonth() + 1,
            now.getFullYear(),
            bot,
            chatId
        );
        bot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error generating stats:', error);
        bot.sendMessage(chatId, '❌ Gagal membuat statistik: ' + error.message);
    }
});

/**
 * /familyreport - Family daily report
 */
bot.onText(/\/familyreport/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    try {
        await bot.sendChatAction(chatId, 'typing');

        const reportMsg = await generateFamilyDailyReport(sheetsClient, new Date(), bot, chatId);
        bot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error generating report:', error);
        bot.sendMessage(chatId, '❌ Gagal membuat laporan: ' + error.message);
    }
});

/**
 * /familystats - Family monthly stats
 */
bot.onText(/\/familystats/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    try {
        await bot.sendChatAction(chatId, 'typing');

        const now = new Date();
        const reportMsg = await generateFamilyMonthlyReport(
            sheetsClient,
            now.getMonth() + 1,
            now.getFullYear(),
            bot,
            chatId
        );
        bot.sendMessage(chatId, reportMsg, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Error generating stats:', error);
        bot.sendMessage(chatId, '❌ Gagal membuat statistik: ' + error.message);
    }
});

/**
 * /sheet - Get Google Sheet link
 */
bot.onText(/\/sheet/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;

    const sheetUrl = sheetsClient.getSpreadsheetUrl();

    bot.sendMessage(
        chatId,
        `📊 *Google Sheet Keluarga*\n\n${sheetUrl}\n\n` +
        'Buka untuk melihat semua transaksi dan statistik!',
        { parse_mode: 'Markdown' }
    );
});

/**
 * /fixsheet - Recreate Summary sheet with formatting (Admin only)
 */
bot.onText(/\/fixsheet/, async (msg) => {
    const chatId = msg.chat.id;

    if (!await requireAuth(bot, msg)) return;
    if (!await requireAdmin(bot, msg)) return;

    try {
        await bot.sendChatAction(chatId, 'typing');
        await bot.sendMessage(chatId, '🔧 Membuat ulang Summary sheet...');

        await recreateSummarySheet(sheetsClient);

        const sheetUrl = sheetsClient.getSpreadsheetUrl();
        bot.sendMessage(
            chatId,
            `✅ *Summary Sheet Berhasil Dibuat Ulang!*\n\n` +
            `Fitur baru:\n` +
            `🎨 Colorful formatting\n` +
            `📊 Pie chart (Income vs Expense)\n` +
            `📊 Bar chart (Kategori)\n` +
            `💛 Highlighted rows\n\n` +
            `Link: ${sheetUrl}`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        console.error('Error fixing sheet:', error);
        bot.sendMessage(chatId, '❌ Gagal membuat ulang sheet: ' + error.message);
    }
});

// ============================================================================
// MESSAGE HANDLERS (with auth check)
// ============================================================================

/**
 * Handle photo messages
 */
bot.on('photo', async (msg) => {
    if (!await requireAuth(bot, msg)) return;
    handlePhoto(bot, msg, sheetsClient);
});

/**
 * Handle voice messages
 */
bot.on('voice', async (msg) => {
    if (!await requireAuth(bot, msg)) return;
    // Handle voice messages
    if (msg.voice) {
        return handleVoiceMessage(bot, msg, sheetsClient);
    }
});

/**
 * Handle text messages (non-commands)
 */
bot.on('message', async (msg) => {
    // Skip if it's a command, photo, or voice
    if (msg.text && !msg.text.startsWith('/') && !msg.photo && !msg.voice) {
        if (!await requireAuth(bot, msg)) return;
        handleTextInput(bot, msg, sheetsClient);
    }
});

/**
 * Handle callback queries (inline keyboard buttons)
 */
bot.on('callback_query', async (callbackQuery) => {
    const { message, data } = callbackQuery;
    const chatId = message.chat.id;

    // Handle remove user callback
    // Handle settings toggles
    if (data.startsWith('settings_')) {
        const { getUserPreferences, updateUserPreferences } = require('./src/notifications/sender');
        const notifType = data.replace('settings_', '');
        const userId = String(callbackQuery.from.id);
        
        const currentPrefs = getUserPreferences(userId);
        const newPrefs = {
            ...currentPrefs,
            [notifType]: !currentPrefs[notifType]
        };
        
        updateUserPreferences(userId, newPrefs);
        
        const keyboard = {
            inline_keyboard: [
                [{ text: `${newPrefs.daily ? '✅' : '☑️'} Daily Summary (21:00)`, callback_data: 'settings_daily' }],
                [{ text: `${newPrefs.weekly ? '✅' : '☑️'} Weekly Summary (Sunday 18:00)`, callback_data: 'settings_weekly' }],
                [{ text: `${newPrefs.monthly ? '✅' : '☑️'} Monthly Insights (28th, 20:00)`, callback_data: 'settings_monthly' }]
            ]
        };
        
        await bot.editMessageReplyMarkup(keyboard, { chat_id: chatId, message_id: message.message_id });
        await bot.answerCallbackQuery(callbackQuery.id, { text: newPrefs[notifType] ? '✅ Enabled' : '☑️ Disabled' });
        return;
    }

    if (data.startsWith('remove_user_')) {
        const userIdToRemove = data.replace('remove_user_', '');
        const adminId = callbackQuery.from.id;

        const result = userManager.removeMember(adminId, userIdToRemove);

        if (result.success) {
            await bot.editMessageText(
                `✅ ${result.message}`,
                {
                    chat_id: chatId,
                    message_id: message.message_id
                }
            );
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: result.message,
                show_alert: true
            });
        }
        return;
    }

    // Handle other callbacks
    handleCallback(bot, callbackQuery, sheetsClient);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
});

process.on('SIGINT', () => {
    console.log('\n👋 Bot shutting down...');
    bot.stopPolling();
    process.exit(0);
});

console.log('✅ Bot is running. Press Ctrl+C to stop.');
