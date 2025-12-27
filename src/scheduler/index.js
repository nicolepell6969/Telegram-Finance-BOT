const cron = require('node-cron');
const config = require('../config/scheduler');
const { generateDailySummary, generateWeeklySummary, formatMonthlyInsights } = require('../insights/summaries');
const { generateSpendingInsights } = require('../insights/generator');
const { sendToAllUsers } = require('../notifications/sender');
const userManager = require('../users/manager');
const { formatDateForSheet } = require('../utils/formatters');

/**
 * Get transactions for a date range
 */
async function getTransactionsForDateRange(sheetsClient, userId, startDate, endDate) {
    try {
        const allData = await sheetsClient.readData();
        const userIdStr = String(userId);

        return allData.filter(row => {
            const rowDate = new Date(row.date);
            const rowUserId = String(row.userId);

            return rowUserId === userIdStr &&
                rowDate >= startDate &&
                rowDate <= endDate &&
                row.type === 'expense'; // Only count expenses for summaries
        }).map(row => ({
            date: row.date,
            amount: parseFloat(row.amount) || 0,
            category: row.category,
            description: row.description,
            type: row.type
        }));
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

/**
 * Daily summary job
 */
function scheduleDailySummary(bot, sheetsClient) {
    const schedule = config.notifications.daily.schedule;

    console.log(`📅 Scheduling daily summary: ${schedule} (${config.timezone})`);

    cron.schedule(schedule, async () => {
        console.log('🌙 Running daily summary job...');

        const users = userManager.getUsers();

        for (const user of users) {
            try {
                // Get today's transactions
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                const endOfDay = new Date(today.setHours(23, 59, 59, 999));

                const transactions = await getTransactionsForDateRange(
                    sheetsClient,
                    user.userId,
                    startOfDay,
                    endOfDay
                );

                if (transactions.length === 0) {
                    console.log(`⏭️ No transactions today for user ${user.userId}`);
                    continue;
                }

                const message = generateDailySummary(transactions, user.name);

                await sendToAllUsers(bot, userManager, message, 'daily');

            } catch (error) {
                console.error(`Error generating daily summary for user ${user.userId}:`, error);
            }
        }

        console.log('✅ Daily summary job complete');
    }, {
        scheduled: config.notifications.daily.enabled,
        timezone: config.timezone
    });
}

/**
 * Weekly summary job
 */
function scheduleWeeklySummary(bot, sheetsClient) {
    const schedule = config.notifications.weekly.schedule;

    console.log(`📅 Scheduling weekly summary: ${schedule} (${config.timezone})`);

    cron.schedule(schedule, async () => {
        console.log('📊 Running weekly summary job...');

        const users = userManager.getUsers();

        for (const user of users) {
            try {
                // This week
                const today = new Date();
                const thisWeekStart = new Date(today);
                thisWeekStart.setDate(today.getDate() - 6);
                thisWeekStart.setHours(0, 0, 0, 0);

                const thisWeekEnd = new Date(today);
                thisWeekEnd.setHours(23, 59, 59, 999);

                // Last week
                const lastWeekStart = new Date(thisWeekStart);
                lastWeekStart.setDate(thisWeekStart.getDate() - 7);

                const lastWeekEnd = new Date(thisWeekStart);
                lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
                lastWeekEnd.setHours(23, 59, 59, 999);

                const thisWeek = await getTransactionsForDateRange(
                    sheetsClient,
                    user.userId,
                    thisWeekStart,
                    thisWeekEnd
                );

                const lastWeek = await getTransactionsForDateRange(
                    sheetsClient,
                    user.userId,
                    lastWeekStart,
                    lastWeekEnd
                );

                if (thisWeek.length === 0) {
                    console.log(`⏭️ No transactions this week for user ${user.userId}`);
                    continue;
                }

                const message = generateWeeklySummary(thisWeek, lastWeek, user.name);

                await sendToAllUsers(bot, userManager, message, 'weekly');

            } catch (error) {
                console.error(`Error generating weekly summary for user ${user.userId}:`, error);
            }
        }

        console.log('✅ Weekly summary job complete');
    }, {
        scheduled: config.notifications.weekly.enabled,
        timezone: config.timezone
    });
}

/**
 * Monthly insights job
 */
function scheduleMonthlyInsights(bot, sheetsClient) {
    const schedule = config.notifications.monthly.schedule;

    console.log(`📅 Scheduling monthly insights: ${schedule} (${config.timezone})`);

    cron.schedule(schedule, async () => {
        console.log('🎯 Running monthly insights job...');

        const users = userManager.getUsers();

        for (const user of users) {
            try {
                // This month
                const today = new Date();
                const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

                // Last month
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

                const thisMonth = await getTransactionsForDateRange(
                    sheetsClient,
                    user.userId,
                    thisMonthStart,
                    thisMonthEnd
                );

                const lastMonth = await getTransactionsForDateRange(
                    sheetsClient,
                    user.userId,
                    lastMonthStart,
                    lastMonthEnd
                );

                if (thisMonth.length === 0) {
                    console.log(`⏭️ No transactions this month for user ${user.userId}`);
                    continue;
                }

                // Aggregate data
                const thisMonthData = {
                    total: thisMonth.reduce((sum, t) => sum + t.amount, 0),
                    count: thisMonth.length,
                    categories: {}
                };

                thisMonth.forEach(t => {
                    thisMonthData.categories[t.category] =
                        (thisMonthData.categories[t.category] || 0) + t.amount;
                });

                const lastMonthData = {
                    total: lastMonth.reduce((sum, t) => sum + t.amount, 0),
                    count: lastMonth.length,
                    categories: {}
                };

                lastMonth.forEach(t => {
                    lastMonthData.categories[t.category] =
                        (lastMonthData.categories[t.category] || 0) + t.amount;
                });

                // Generate AI insights
                console.log('🤖 Generating AI insights...');
                const aiInsights = await generateSpendingInsights(thisMonthData, lastMonthData);

                const message = formatMonthlyInsights(thisMonthData, aiInsights, user.name);

                await sendToAllUsers(bot, userManager, message, 'monthly');

            } catch (error) {
                console.error(`Error generating monthly insights for user ${user.userId}:`, error);
            }
        }

        console.log('✅ Monthly insights job complete');
    }, {
        scheduled: config.notifications.monthly.enabled,
        timezone: config.timezone
    });
}

/**
 * Initialize all scheduled jobs
 */
function initializeScheduler(bot, sheetsClient) {
    console.log('🚀 Initializing scheduler...');
    console.log(`⏰ Timezone: ${config.timezone}`);

    scheduleDailySummary(bot, sheetsClient);
    scheduleWeeklySummary(bot, sheetsClient);
    scheduleMonthlyInsights(bot, sheetsClient);

    console.log('✅ All scheduled jobs initialized');
}

module.exports = {
    initializeScheduler,
    scheduleDailySummary,
    scheduleWeeklySummary,
    scheduleMonthlyInsights
};
