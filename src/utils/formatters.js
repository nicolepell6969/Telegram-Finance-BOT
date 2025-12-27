/**
 * Formatting utilities untuk Telegram messages
 */

/**
 * Format currency dalam Rupiah
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format date untuk display
 */
function formatDate(date, format = 'full') {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    const options = {
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        short: { year: 'numeric', month: 'short', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' }
    };

    return new Intl.DateTimeFormat('id-ID', options[format] || options.full).format(date);
}

/**
 * Format date untuk Google Sheets (YYYY-MM-DD)
 */
function formatDateForSheet(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Format time untuk Google Sheets (HH:MM:SS)
 */
function formatTimeForSheet(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format transaction untuk confirmation message
 */
function formatTransactionConfirmation(transaction) {
    const type = transaction.type === 'expense' ? '💸 Pengeluaran' : '💰 Pemasukan';
    const amount = formatCurrency(transaction.amount);
    const category = transaction.categoryDisplay || transaction.category;
    const desc = transaction.description || '-';
    const date = formatDate(transaction.date, 'short');

    return `
${type}
━━━━━━━━━━━━━━━
💵 Jumlah: ${amount}
📁 Kategori: ${category}
📝 Deskripsi: ${desc}
📅 Tanggal: ${date}
━━━━━━━━━━━━━━━
`;
}

/**
 * Format daily summary
 */
function formatDailySummary(summary) {
    const { date, totalExpense, totalIncome, balance, transactions } = summary;

    let message = `
📊 *Ringkasan Harian*
📅 ${formatDate(date, 'full')}

💸 Total Pengeluaran: ${formatCurrency(totalExpense)}
💰 Total Pemasukan: ${formatCurrency(totalIncome)}
💵 Saldo: ${formatCurrency(balance)}

📋 *Transaksi (${transactions.length})*
━━━━━━━━━━━━━━━
`;

    transactions.forEach((t, i) => {
        const icon = t.type === 'expense' ? '💸' : '💰';
        message += `\n${i + 1}. ${icon} ${formatCurrency(t.amount)} - ${t.category}`;
        if (t.description) {
            message += `\n   📝 ${t.description}`;
        }
    });

    return message;
}

/**
 * Format monthly summary
 */
function formatMonthlySummary(summary) {
    const { month, year, totalExpense, totalIncome, balance, expenseByCategory } = summary;

    let message = `
📊 *Ringkasan Bulanan*
📅 ${month} ${year}

💸 Total Pengeluaran: ${formatCurrency(totalExpense)}
💰 Total Pemasukan: ${formatCurrency(totalIncome)}
💵 Saldo: ${formatCurrency(balance)}

📁 *Pengeluaran per Kategori*
━━━━━━━━━━━━━━━
`;

    if (expenseByCategory && expenseByCategory.length > 0) {
        expenseByCategory.forEach(cat => {
            const percentage = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0;
            message += `\n${cat.category}: ${formatCurrency(cat.total)} (${percentage}%)`;
        });
    } else {
        message += '\nBelum ada data';
    }

    return message;
}


/**
 * Format confirmation message for transaction
 */
function formatConfirmation(transaction) {
    const type = transaction.type === 'expense' ? '💸 Pengeluaran' : '💰 Pemasukan';
    const amount = formatCurrency(transaction.amount);
    const category = transaction.categoryDisplay || transaction.category;
    const desc = transaction.description || '-';

    return `
${type}
━━━━━━━━━━━━━━━
💵 *Jumlah:* ${amount}
📁 *Kategori:* ${category}
📝 *Deskripsi:* ${desc}
━━━━━━━━━━━━━━━

Simpan transaksi ini?
    `.trim();
}

module.exports = {
    formatCurrency,
    formatDate,
    formatDateForSheet,
    formatTimeForSheet,
    formatConfirmation,
    formatTransactionConfirmation,
    formatDailySummary,
    formatMonthlySummary
};
