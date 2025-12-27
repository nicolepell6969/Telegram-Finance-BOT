const { formatCurrency, formatDate } = require('../utils/formatters');

/**
 * Generate daily spending summary
 */
function generateDailySummary(transactions, userName) {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.length;

    // Get top category
    const categoryTotals = {};
    transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];

    const date = formatDate(new Date(), 'full');

    let message = `🌙 *Rekap Harian* - ${date}\n\n`;
    message += `💰 Total Pengeluaran: ${formatCurrency(total)}\n`;
    message += `📝 Transaksi: ${count}\n`;

    if (topCategory) {
        message += `🏆 Kategori Terbanyak: ${topCategory[0]} (${formatCurrency(topCategory[1])})\n`;
    }

    if (count > 10) {
        message += `\n⚠️ Banyak transaksi hari ini!\n`;
    }

    message += `\n💤 Selamat istirahat, ${userName}!`;

    return message;
}

/**
 * Generate weekly spending summary
 */
function generateWeeklySummary(thisWeek, lastWeek, userName) {
    const thisTotal = thisWeek.reduce((sum, t) => sum + t.amount, 0);
    const lastTotal = lastWeek.reduce((sum, t) => sum + t.amount, 0);

    const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal * 100).toFixed(1) : 0;
    const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    // Get top 3 categories
    const categoryTotals = {};
    thisWeek.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const top3 = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    // Get week date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    let message = `📊 *Rekap Mingguan*\n`;
    message += `📅 ${formatDate(startDate, 'short')} - ${formatDate(endDate, 'short')}\n\n`;
    message += `💸 Minggu Ini: ${formatCurrency(thisTotal)}\n`;
    message += `📈 vs Minggu Lalu: ${changeIcon} ${Math.abs(change)}%\n\n`;

    if (top3.length > 0) {
        message += `🏆 *Top 3 Kategori:*\n`;
        top3.forEach((cat, i) => {
            message += `${i + 1}. ${cat[0]}: ${formatCurrency(cat[1])}\n`;
        });
    }

    // Simple insight
    if (change > 20) {
        message += `\n💡 Pengeluaran naik signifikan minggu ini!`;
    } else if (change < -20) {
        message += `\n👍 Pengeluaran turun signifikan! Pertahankan!`;
    }

    return message;
}

/**
 * Format monthly insights message
 */
function formatMonthlyInsights(summary, aiInsights, userName) {
    const monthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    let message = `🎯 *Insights Bulanan - ${monthName}*\n\n`;
    message += `💰 Total: ${formatCurrency(summary.total)}\n`;
    message += `📊 Transaksi: ${summary.count}\n\n`;

    // AI Insights
    message += `${aiInsights}\n\n`;

    // Category breakdown (top 5)
    message += `📈 *Spending by Category:*\n`;
    const top5 = Object.entries(summary.categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    top5.forEach(cat => {
        const percentage = ((cat[1] / summary.total) * 100).toFixed(1);
        message += `• ${cat[0]}: ${formatCurrency(cat[1])} (${percentage}%)\n`;
    });

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleString('id-ID', { month: 'long' });

    message += `\n📅 Siap untuk ${nextMonthName}!`;

    return message;
}

module.exports = {
    generateDailySummary,
    generateWeeklySummary,
    formatMonthlyInsights
};
