const { formatDetailedDailySummary, formatDetailedMonthlySummary } = require('./detailedFormatter');
const { generatePieChartUrl, generateBarChartUrl, getCategoryColor } = require('../charts/generator');
const userManager = require('../users/manager');
const axios = require('axios');

/**
 * Generate daily report for specific user WITH PIE CHART
 */
async function generateUserDailyReport(sheetsClient, userId, date = new Date(), bot = null, chatId = null) {
    try {
        const summary = await sheetsClient.getDailyTransactions(date, userId);
        const userName = userManager.getUserName(userId);
        const message = formatDetailedDailySummary(summary, userName);

        // Generate pie chart if there's data
        if (bot && chatId && (summary.totalExpense > 0 || summary.totalIncome > 0)) {
            const chartData = [
                { label: 'Pengeluaran', value: summary.totalExpense, color: '#e74c3c' },
                { label: 'Pemasukan', value: summary.totalIncome, color: '#2ecc71' }
            ];

            const chartUrl = generatePieChartUrl(chartData, 'Pengeluaran vs Pemasukan');

            // Send  chart as photo
            try {
                await bot.sendPhoto(chatId, chartUrl, {
                    caption: `📊 Visualisasi Harian - ${userName}`
                });
            } catch (error) {
                console.error('Error sending chart:', error);
            }
        }

        return message;
    } catch (error) {
        console.error('Error generating user daily report:', error);
        throw error;
    }
}

/**
 * Generate monthly report for specific user WITH CHARTS
 */
async function generateUserMonthlyReport(sheetsClient, userId, month, year, bot = null, chatId = null) {
    try {
        const summary = await sheetsClient.getMonthlyReport(month, year, userId);
        const userName = userManager.getUserName(userId);
        const message = formatDetailedMonthlySummary(summary, userName);

        // Generate charts if there's data
        if (bot && chatId && summary.expenseByCategory.length > 0) {
            // Category bar chart
            const barChartData = summary.expenseByCategory.slice(0, 8).map(cat => ({
                label: cat.category,
                value: cat.total,
                color: getCategoryColor(cat.category)
            }));

            const barChartUrl = generateBarChartUrl(barChartData, 'Top Pengeluaran', '', 'Amount');

            try {
                await bot.sendPhoto(chatId, barChartUrl, {
                    caption: `📊 Pengeluaran per Kategori - ${userName}`
                });
            } catch (error) {
                console.error('Error sending chart:', error);
            }
        }

        return message;
    } catch (error) {
        console.error('Error generating user monthly report:', error);
        throw error;
    }
}

/**
 * Generate family-wide daily report WITH PIE CHART
 */
async function generateFamilyDailyReport(sheetsClient, date = new Date(), bot = null, chatId = null) {
    try {
        const summary = await sheetsClient.getDailyTransactions(date);
        const message = formatDetailedDailySummary(summary);

        // Generate pie chart
        if (bot && chatId && (summary.totalExpense > 0 || summary.totalIncome > 0)) {
            const chartData = [
                { label: 'Pengeluaran', value: summary.totalExpense, color: '#e74c3c' },
                { label: 'Pemasukan', value: summary.totalIncome, color: '#2ecc71' }
            ];

            const chartUrl = generatePieChartUrl(chartData, 'Pengeluaran vs Pemasukan Keluarga');

            try {
                await bot.sendPhoto(chatId, chartUrl, {
                    caption: '📊 Visualisasi Harian Keluarga'
                });
            } catch (error) {
                console.error('Error sending chart:', error);
            }
        }

        return message;
    } catch (error) {
        console.error('Error generating family daily report:', error);
        throw error;
    }
}

/**
 * Generate family-wide monthly report WITH CHARTS
 */
async function generateFamilyMonthlyReport(sheetsClient, month, year, bot = null, chatId = null) {
    try {
        const summary = await sheetsClient.getMonthlyReport(month, year);
        const message = formatDetailedMonthlySummary(summary);

        // Generate charts
        if (bot && chatId && summary.expenseByCategory.length > 0) {
            const barChartData = summary.expenseByCategory.slice(0, 8).map(cat => ({
                label: cat.category,
                value: cat.total,
                color: getCategoryColor(cat.category)
            }));

            const barChartUrl = generateBarChartUrl(barChartData, 'Pengeluaran Keluarga per Kategori', '', 'Amount');

            try {
                await bot.sendPhoto(chatId, barChartUrl, {
                    caption: '📊 Pengeluaran Keluarga per Kategori'
                });
            } catch (error) {
                console.error('Error sending chart:', error);
            }
        }

        return message;
    } catch (error) {
        console.error('Error generating family monthly report:', error);
        throw error;
    }
}

/**
 * Generate comparison report between family members
 */
async function generateMemberComparisonReport(sheetsClient, month, year) {
    try {
        const allUsers = await sheetsClient.getUsersWithTransactions(month, year);

        let message = `👨‍👩‍👧‍👦 *Perbandingan Pengeluaran Member*\n📅 ${getMonthName(month)} ${year}\n\n`;

        let totalFamily = 0;
        const userStats = [];

        for (const user of allUsers) {
            const summary = await sheetsClient.getMonthlyReport(month, year, user.userId);
            totalFamily += summary.totalExpense;
            userStats.push({
                name: user.userName,
                expense: summary.totalExpense
            });
        }

        // Sort by expense descending
        userStats.sort((a, b) => b.expense - a.expense);

        userStats.forEach((stat, index) => {
            const percentage = totalFamily > 0 ? ((stat.expense / totalFamily) * 100).toFixed(1) : 0;
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊';
            message += `${emoji} ${stat.name}: ${formatCurrency(stat.expense)} (${percentage}%)\n`;
        });

        message += `\n💰 Total Keluarga: ${formatCurrency(totalFamily)}`;

        return message;
    } catch (error) {
        console.error('Error generating comparison report:', error);
        throw error;
    }
}

/**
 * Helper: Get month name in Indonesian
 */
function getMonthName(month) {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || 'Unknown';
}

module.exports = {
    generateUserDailyReport,
    generateUserMonthlyReport,
    generateFamilyDailyReport,
    generateFamilyMonthlyReport,
    generateMemberComparisonReport
};
