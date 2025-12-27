const { validateTransaction } = require('../utils/validators');
const { formatConfirmation } = require('../utils/formatters');
const { getCategoryDisplay } = require('../config/categories');
const GeminiClient = require('../gemini/client');
const { getUserInfo } = require('../middleware/auth');

const gemini = new GeminiClient();

/**
 * Handle text input untuk expense/income manual
 */
async function handleTextInput(bot, msg, sheetsClient) {
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
        // Skip commands
        if (text.startsWith('/')) {
            return;
        }

        // Show typing indicator
        await bot.sendChatAction(chatId, 'typing');

        // Parse dengan Gemini AI (Google)
        console.log('📝 Parsing text with Gemini...');
        const parsed = await gemini.parseExpenseFromText(text);

        // Get user info
        const userInfo = getUserInfo(msg);

        if (parsed.confidence < 0.5) {
            // Low confidence, ask for clarification
            return bot.sendMessage(
                chatId,
                '❓ Maaf, saya kurang yakin memahami input Anda.\n\n' +
                'Format yang disarankan:\n' +
                '💸 Pengeluaran: "makan siang 50000" atau "bayar parkir 5rb"\n' +
                '💰 Pemasukan: "gaji 5 juta" atau "dapat bonus 500rb"\n\n' +
                'Atau gunakan command:\n' +
                '/expense - Catat pengeluaran\n' +
                '/income - Catat pemasukan'
            );
        }

        // Validate
        const validation = validateTransaction({
            type: parsed.type,
            amount: parsed.amount,
            category: parsed.category.toUpperCase(), // Ensure uppercase
            description: parsed.description,
            userId: userInfo.userId,
            userName: userInfo.userName,
            date: new Date()
        });

        if (!validation.valid) {
            return bot.sendMessage(chatId, '❌ Data tidak valid:\n' + validation.errors.join('\n'));
        }

        const transaction = validation.cleanedData;
        const categoryDisplay = getCategoryDisplay(transaction.category, transaction.type);
        transaction.categoryDisplay = categoryDisplay;

        // Request confirmation
        const confirmationMsg = await bot.sendMessage(
            chatId,
            formatConfirmation(transaction),
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Simpan', callback_data: `save_${Date.now()}` },
                            { text: '❌ Batal', callback_data: 'cancel' }
                        ]
                    ]
                }
            }
        );

        // Store pending transaction
        global.pendingTransactions = global.pendingTransactions || {};
        global.pendingTransactions[confirmationMsg.message_id] = transaction;

    } catch (error) {
        console.error('Error handling text:', error);
        bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses input Anda.');
    }
}

/**
 * Handle callback untuk save/cancel
 */
async function handleCallback(bot, callbackQuery, sheetsClient) {
    const { message, data } = callbackQuery;
    const chatId = message.chat.id;

    try {
        if (data === 'cancel') {
            await bot.editMessageText(
                '❌ Transaksi dibatalkan',
                {
                    chat_id: chatId,
                    message_id: message.message_id
                }
            );
            delete global.pendingTransactions[message.message_id];
            return bot.answerCallbackQuery(callbackQuery.id);
        }

        if (data.startsWith('save_')) {
            const transaction = global.pendingTransactions[message.message_id];

            if (!transaction) {
                return bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Transaksi sudah kadaluarsa',
                    show_alert: true
                });
            }

            // Save to Google Sheets
            await sheetsClient.addTransaction(transaction);

            await bot.editMessageText(
                '✅ Transaksi berhasil disimpan!\n\n' +
                `Lihat detail di: ${sheetsClient.getSpreadsheetUrl()}`,
                {
                    chat_id: chatId,
                    message_id: message.message_id
                }
            );

            delete global.pendingTransactions[message.message_id];
            return bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Tersimpan!'
            });
        }

        // Handle category selection
        if (data.startsWith('category_')) {
            // This will be used for manual category selection
            const parts = data.split('_');
            const type = parts[1];
            const category = parts[2];

            // Update pending transaction with selected category
            const transaction = global.pendingTransactions[message.message_id];
            if (transaction) {
                transaction.category = category;
                transaction.categoryDisplay = getCategoryDisplay(category, type);

                await bot.editMessageText(
                    formatConfirmation(transaction),
                    {
                        chat_id: chatId,
                        message_id: message.message_id,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ Simpan', callback_data: `save_${Date.now()}` },
                                    { text: '❌ Batal', callback_data: 'cancel' }
                                ]
                            ]
                        }
                    }
                );
            }

            return bot.answerCallbackQuery(callbackQuery.id);
        }

        bot.answerCallbackQuery(callbackQuery.id);

    } catch (error) {
        console.error('Error handling callback:', error);
        bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Terjadi kesalahan',
            show_alert: true
        });
    }
}

module.exports = {
    handleTextInput,
    handleCallback
};
