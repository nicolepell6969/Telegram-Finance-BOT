const { formatCurrency, formatDate } = require('../utils/formatters');
const { getCategoryColor } = require('../charts/generator');

/**
 * Format detailed daily summary with sorted transactions
 */
function formatDetailedDailySummary(summary, userName = null) {
    const { date, totalExpense, totalIncome, balance, transactions } = summary;

    // Calculate percentages
    const total = totalExpense + totalIncome;
    const expensePercent = total > 0 ? ((totalExpense / total) * 100).toFixed(1) : 0;
    const incomePercent = total > 0 ? ((totalIncome / total) * 100).toFixed(1) : 0;

    const header = userName
        ? `👤 *Laporan Harian - ${userName}*`
        : `📊 *Laporan Harian*`;

    let message = `${header}\n📅 ${formatDate(date, 'full')}\n\n`;

    // Summary box
    message += `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    message += `┃  💰 *RINGKASAN*\n`;
    message += `┣━━━━━━━━━━━━━━━━━━━━━━┫\n`;
    message += `┃ 💸 Pengeluaran: ${formatCurrency(totalExpense)}\n`;
    message += `┃ 💰 Pemasukan: ${formatCurrency(totalIncome)}\n`;
    message += `┃ 💵 Saldo: ${formatCurrency(balance)}\n`;
    message += `┃ 📝 Total Transaksi: ${transactions.length}\n`;
    message += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    // Pie chart representation (text-based)
    if (totalExpense > 0 || totalIncome > 0) {
        message += `📊 *Proporsi:*\n`;
        message += `💸 Pengeluaran: ${expensePercent}% ${'█'.repeat(Math.round(expensePercent / 5))}\n`;
        message += `💰 Pemasukan: ${incomePercent}% ${'█'.repeat(Math.round(incomePercent / 5))}\n\n`;
    }

    // Expenses sorted by amount (largest first)
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount);

    if (expenses.length > 0) {
        message += `💸 *PENGELUARAN (${expenses.length})*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;

        expenses.forEach((t, i) => {
            const percentage = totalExpense > 0 ? ((t.amount / totalExpense) * 100).toFixed(1) : 0;
            const bar = '▓'.repeat(Math.min(Math.round(percentage / 5), 10));

            message += `\n${i + 1}. ${formatCurrency(t.amount)} (${percentage}%)\n`;
            message += `   📁 ${t.category}\n`;
            if (t.description) {
                message += `   📝 ${t.description}\n`;
            }
            if (t.userName && !userName) {
                message += `   👤 ${t.userName}\n`;
            }
            message += `   ${bar}\n`;
        });
        message += `\n`;
    }

    // Income sorted by amount (largest first)
    const income = transactions
        .filter(t => t.type === 'income')
        .sort((a, b) => b.amount - a.amount);

    if (income.length > 0) {
        message += `💰 *PEMASUKAN (${income.length})*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n`;

        income.forEach((t, i) => {
            const percentage = totalIncome > 0 ? ((t.amount / totalIncome) * 100).toFixed(1) : 0;
            const bar = '▓'.repeat(Math.min(Math.round(percentage / 5), 10));

            message += `\n${i + 1}. ${formatCurrency(t.amount)} (${percentage}%)\n`;
            message += `   📁 ${t.category}\n`;
            if (t.description) {
                message += `   📝 ${t.description}\n`;
            }
            if (t.userName && !userName) {
                message += `   👤 ${t.userName}\n`;
            }
            message += `   ${bar}\n`;
        });
    }

    if (transactions.length === 0) {
        message += `\n📭 Belum ada transaksi hari ini.\n`;
    }

    return message;
}

/**
 * Format detailed monthly summary
 */
function formatDetailedMonthlySummary(summary, userName = null) {
    const { month, year, totalExpense, totalIncome, balance, expenseByCategory } = summary;

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const header = userName
        ? `👤 *Statistik Bulanan - ${userName}*`
        : `📊 *Statistik Bulanan*`;

    let message = `${header}\n📅 ${monthNames[month - 1]} ${year}\n\n`;

    // Summary box
    message += `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    message += `┃  💰 *RINGKASAN BULAN INI*\n`;
    message += `┣━━━━━━━━━━━━━━━━━━━━━━┫\n`;
    message += `┃ 💸 Total Pengeluaran:\n`;
    message += `┃    ${formatCurrency(totalExpense)}\n`;
    message += `┃ 💰 Total Pemasukan:\n`;
    message += `┃    ${formatCurrency(totalIncome)}\n`;
    message += `┃ 💵 Saldo:\n`;
    message += `┃    ${formatCurrency(balance)}\n`;
    message += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    // Income vs Expense pie representation
    const total = totalExpense + totalIncome;
    if (total > 0) {
        const expensePercent = ((totalExpense / total) * 100).toFixed(1);
        const incomePercent = ((totalIncome / total) * 100).toFixed(1);

        message += `📊 *Proporsi Total:*\n`;
        message += `💸 Pengeluaran: ${expensePercent}% ${'█'.repeat(Math.round(expensePercent / 5))}\n`;
        message += `💰 Pemasukan: ${incomePercent}% ${'█'.repeat(Math.round(incomePercent / 5))}\n\n`;
    }

    // Expense breakdown by category (sorted largest first)
    if (expenseByCategory && expenseByCategory.length > 0) {
        message += `💸 *PENGELUARAN PER KATEGORI*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        expenseByCategory.forEach((cat, i) => {
            const percentage = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0;
            const barLength = Math.min(Math.round(percentage / 5), 20);
            const bar = '▓'.repeat(barLength) + '░'.repeat(20 - barLength);

            message += `${i + 1}. ${cat.category}\n`;
            message += `   ${formatCurrency(cat.total)} (${percentage}%)\n`;
            message += `   ${bar}\n\n`;
        });

        // Top 3 categories
        message += `🏆 *TOP 3 PENGELUARAN*\n`;
        expenseByCategory.slice(0, 3).forEach((cat, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            message += `${medals[i]} ${cat.category}: ${formatCurrency(cat.total)}\n`;
        });
    } else {
        message += `\n📭 Belum ada pengeluaran bulan ini.\n`;
    }

    // Savings rate
    if (totalIncome > 0) {
        const savingsRate = ((balance / totalIncome) * 100).toFixed(1);
        message += `\n💎 *Tingkat Tabungan:* ${savingsRate}%\n`;

        if (savingsRate >= 20) {
            message += `✨ Luar biasa! Anda menabung lebih dari 20%!\n`;
        } else if (savingsRate >= 10) {
            message += `👍 Bagus! Pertahankan kebiasaan menabung!\n`;
        } else if (savingsRate > 0) {
            message += `💪 Coba tingkatkan tabungan Anda!\n`;
        } else {
            message += `⚠️ Pengeluaran melebihi pemasukan!\n`;
        }
    }

    return message;
}

module.exports = {
    formatDetailedDailySummary,
    formatDetailedMonthlySummary
};
