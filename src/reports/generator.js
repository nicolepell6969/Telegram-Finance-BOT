const { formatDailySummary, formatMonthlySummary } = require('../utils/formatters');

/**
 * Generate daily report
 */
async function generateDailyReport(sheetsClient, date = new Date()) {
    try {
        const summary = await sheetsClient.getDailyTransactions(date);
        return formatDailySummary(summary);
    } catch (error) {
        console.error('Error generating daily report:', error);
        throw error;
    }
}

/**
 * Generate monthly report
 */
async function generateMonthlyReport(sheetsClient, month, year) {
    try {
        const summary = await sheetsClient.getMonthlyReport(month, year);
        return formatMonthlySummary(summary);
    } catch (error) {
        console.error('Error generating monthly report:', error);
        throw error;
    }
}

/**
 * Generate current month report
 */
async function generateCurrentMonthReport(sheetsClient) {
    const now = new Date();
    return generateMonthlyReport(sheetsClient, now.getMonth() + 1, now.getFullYear());
}

module.exports = {
    generateDailyReport,
    generateMonthlyReport,
    generateCurrentMonthReport
};
