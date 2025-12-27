const GroqClient = require('../groq/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { validateTransaction } = require('../utils/validators');
const { getCategoryDisplay } = require('../config/categories');
const { getUserInfo } = require('../middleware/auth');

const groq = new GroqClient();

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * Handle photo messages (receipt OCR)
 */
async function handlePhoto(bot, msg, sheetsClient) {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution

    try {
        // Show processing indicator
        await bot.sendChatAction(chatId, 'typing');
        const processingMsg = await bot.sendMessage(chatId, '📸 Memproses foto nota...');

        // Download photo
        const fileLink = await bot.getFileLink(photo.file_id);
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Save temporarily
        const tempPath = path.join(DOWNLOADS_DIR, `receipt_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, imageBuffer);

        // Analyze with Groq
        const receiptData = await groq.analyzeReceipt(imageBuffer);

        // Clean up temp file
        fs.unlinkSync(tempPath);

        // Update message
        await bot.editMessageText(
            `✅ Foto berhasil diproses!\n\n` +
            `🏪 Merchant: ${receiptData.merchant}\n` +
            `💰 Total: Rp ${receiptData.totalAmount.toLocaleString('id-ID')}\n` +
            `📁 Kategori: ${receiptData.category}\n` +
            `🎯 Confidence: ${(receiptData.confidence * 100).toFixed(0)}%`,
            {
                chat_id: chatId,
                message_id: processingMsg.message_id
            }
        );

        // Check confidence
        if (receiptData.confidence < 0.5) {
            return bot.sendMessage(
                chatId,
                '⚠️ Confidence rendah. Silakan input manual menggunakan /expense'
            );
        }

        // Prepare transaction
        const userInfo = getUserInfo(msg);
        const transaction = {
            type: 'expense',
            amount: receiptData.totalAmount,
            category: receiptData.category.toUpperCase(), // Ensure uppercase
            description: `${receiptData.merchant}${receiptData.items.length > 0 ? ' - ' + receiptData.items.map(i => i.name).join(', ') : ''}`,
            userId: userInfo.userId,
            userName: userInfo.userName,
            date: receiptData.date ? new Date(receiptData.date) : new Date()
        };

        // Validate
        const validation = validateTransaction(transaction);
        if (!validation.valid) {
            return bot.sendMessage(chatId, '❌ Data tidak valid:\n' + validation.errors.join('\n'));
        }

        const cleanedTransaction = validation.cleanedData;
        const categoryDisplay = getCategoryDisplay(cleanedTransaction.category, 'expense');
        cleanedTransaction.categoryDisplay = categoryDisplay;

        // Request confirmation
        const { formatTransactionConfirmation } = require('../utils/formatters');
        const confirmationMsg = await bot.sendMessage(
            chatId,
            formatTransactionConfirmation(cleanedTransaction) + '\nSimpan transaksi ini?',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Simpan', callback_data: `save_${Date.now()}` },
                            { text: '✏️ Edit Kategori', callback_data: 'edit_category' }
                        ],
                        [
                            { text: '❌ Batal', callback_data: 'cancel' }
                        ]
                    ]
                }
            }
        );

        // Store pending transaction
        global.pendingTransactions = global.pendingTransactions || {};
        global.pendingTransactions[confirmationMsg.message_id] = cleanedTransaction;

    } catch (error) {
        console.error('Error handling photo:', error);
        bot.sendMessage(chatId, '❌ Gagal memproses foto. Error: ' + error.message);
    }
}

module.exports = {
    handlePhoto
};
