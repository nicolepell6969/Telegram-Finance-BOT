const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { validateTransaction } = require('../utils/validators');
const { formatConfirmation } = require('../utils/formatters');
const { getCategoryDisplay } = require('../config/categories');
const GroqClient = require('../groq/client');
const GeminiClient = require('../gemini/client');
const { getUserInfo } = require('../middleware/auth');

const groqClient = new GroqClient();
const geminiClient = new GeminiClient();

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

/**
 * Handle voice message untuk expense/income
 * Uses Groq Whisper for transcription + Gemini for parsing
 */
async function handleVoiceMessage(bot, msg, sheetsClient) {
    const chatId = msg.chat.id;
    const voice = msg.voice;

    try {
        await bot.sendChatAction(chatId, 'typing');
        const processingMsg = await bot.sendMessage(chatId, '🎤 Mendengarkan pesan suara...');

        // Download voice file from Telegram
        const fileId = voice.file_id;
        const file = await bot.getFile(fileId);
        const filePath = file.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const audioBuffer = Buffer.from(response.data);

        // Save temporarily
        const tempPath = path.join(DOWNLOADS_DIR, `voice_${Date.now()}.ogg`);
        fs.writeFileSync(tempPath, audioBuffer);

        // Transcribe with Groq Whisper
        console.log('🎤 Transcribing with Groq Whisper...');
        const transcription = await groqClient.transcribeVoice(tempPath);

        // Clean up temp file
        fs.unlinkSync(tempPath);

        await bot.editMessageText(
            `✅ Terdengar: "${transcription}"`,
            {
                chat_id: chatId,
                message_id: processingMsg.message_id
            }
        );

        // Parse dengan Gemini AI
        console.log('📝 Parsing transcription with Gemini...');
        const parsed = await geminiClient.parseExpenseFromText(transcription);

        // Get user info
        const userInfo = getUserInfo(msg);

        if (parsed.confidence < 0.5) {
            return bot.sendMessage(
                chatId,
                '❓ Maaf, saya kurang yakin memahami pesan suara Anda.\n\n' +
                'Coba ulangi dengan lebih jelas, atau ketik manual.'
            );
        }

        // Validate
        const validation = validateTransaction({
            type: parsed.type,
            amount: parsed.amount,
            category: parsed.category.toUpperCase(),
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
        console.error('Error handling voice:', error);
        bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses pesan suara Anda.');
    }
}

module.exports = {
    handleVoiceMessage
};
