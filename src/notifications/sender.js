const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../../data/user-settings.json');

/**
 * Load user settings from file
 */
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
    return { users: {} };
}

/**
 * Save user settings to file
 */
function saveSettings(settings) {
    try {
        const dir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving user settings:', error);
    }
}

/**
 * Get user notification preferences
 */
function getUserPreferences(userId) {
    const settings = loadSettings();
    const userIdStr = String(userId);

    // Default preferences
    const defaults = {
        daily: true,
        weekly: true,
        monthly: true
    };

    return settings.users[userIdStr] || defaults;
}

/**
 * Update user notification preferences
 */
function updateUserPreferences(userId, preferences) {
    const settings = loadSettings();
    const userIdStr = String(userId);

    settings.users[userIdStr] = {
        ...getUserPreferences(userId),
        ...preferences
    };

    saveSettings(settings);
    return settings.users[userIdStr];
}

/**
 * Send notification to user with retry logic
 */
async function sendNotification(bot, userId, message, options = {}) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            await bot.sendMessage(userId, message, {
                parse_mode: 'Markdown',
                ...options
            });

            console.log(`✅ Notification sent to user ${userId}`);
            return true;

        } catch (error) {
            attempt++;
            console.error(`❌ Failed to send notification (attempt ${attempt}/${maxRetries}):`, error.message);

            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Failed to send notification to user ${userId} after ${maxRetries} attempts`);
    return false;
}

/**
 * Send notification to all users (with preferences check)
 */
async function sendToAllUsers(bot, userManager, message, notificationType) {
    const users = userManager.getUsers();
    const results = {
        sent: 0,
        skipped: 0,
        failed: 0
    };

    for (const user of users) {
        const prefs = getUserPreferences(user.userId);

        // Check if user has this notification type enabled
        if (!prefs[notificationType]) {
            console.log(`⏭️ Skipping user ${user.userId} - ${notificationType} disabled`);
            results.skipped++;
            continue;
        }

        const success = await sendNotification(bot, user.userId, message);
        if (success) {
            results.sent++;
        } else {
            results.failed++;
        }

        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Notification results: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
}

module.exports = {
    getUserPreferences,
    updateUserPreferences,
    sendNotification,
    sendToAllUsers
};
