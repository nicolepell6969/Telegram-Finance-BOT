/**
 * /settings command handler
 */
const { getUserPreferences, updateUserPreferences } = require('./src/notifications/sender');

module.exports = (bot) => {
    bot.onText(/\/settings/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = String(msg.from.id);

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

    // Export for callback handler
    return { getUserPreferences, updateUserPreferences };
};
