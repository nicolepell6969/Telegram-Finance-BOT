/**
 * Scheduler configuration for automated notifications
 */

module.exports = {
    timezone: 'Asia/Jakarta',

    notifications: {
        daily: {
            enabled: true,
            // Cron: 21:00 WIB every day
            schedule: '0 21 * * *',
            description: 'Daily spending summary'
        },

        weekly: {
            enabled: true,
            // Cron: 18:00 WIB every Sunday (day 0)
            schedule: '0 18 * * 0',
            description: 'Weekly spending summary'
        },

        monthly: {
            enabled: true,
            // Cron: 20:00 WIB on 28th (close to end of month, safe for all months)
            schedule: '0 20 28 * *',
            description: 'Monthly spending insights with AI'
        }
    },

    // For testing - uncomment to test every 5 minutes
    // testMode: true,
    // testSchedule: '*/5 * * * *'
};
