const userManager = require('../users/manager');

/**
 * Check if user is authorized to use bot
 */
async function requireAuth(bot, msg) {
    const userId = msg.from.id;
    const userName = msg.from.first_name || 'User';

    if (!userManager.isAuthorized(userId)) {
        const registerMsg =
            `👋 Halo ${userName}!\n\n` +
            `Sepertinya Anda belum terdaftar. Silakan daftar terlebih dahulu:\n\n` +
            `📝 Ketik: /register [nama Anda]\n\n` +
            `Contoh: /register Papa\n\n` +
            `${userManager.getUserCount() === 0 ? '👑 Anda akan menjadi admin (user pertama)' : '⏳ Tunggu persetujuan admin setelah mendaftar'}`;

        await bot.sendMessage(msg.chat.id, registerMsg);
        return false;
    }

    return true;
}

/**
 * Check if user is admin
 */
async function requireAdmin(bot, msg) {
    const userId = msg.from.id;

    if (!userManager.isAdmin(userId)) {
        await bot.sendMessage(
            msg.chat.id,
            '⛔ Command ini hanya untuk admin.\n\nHubungi admin untuk bantuan.'
        );
        return false;
    }

    return true;
}

/**
 * Get user info from message
 */
function getUserInfo(msg) {
    const userId = msg.from.id;
    const user = userManager.getUser(userId);

    return {
        userId,
        userName: user ? user.name : msg.from.first_name || 'User',
        isAdmin: user ? user.role === 'admin' : false,
        telegramName: msg.from.first_name || 'User'
    };
}

module.exports = {
    requireAuth,
    requireAdmin,
    getUserInfo
};
