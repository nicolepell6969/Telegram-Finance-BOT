const GeminiClient = require('../gemini/client');

const gemini = new GeminiClient();

/**
 * Generate AI-powered spending insights
 */
async function generateSpendingInsights(currentMonth, previousMonth) {
    try {
        const prompt = `Analyze this spending data and provide insights in Indonesian:

Current Month:
- Total: Rp ${currentMonth.total.toLocaleString('id-ID')}
- Categories: ${JSON.stringify(currentMonth.categories, null, 2)}
- Transactions: ${currentMonth.count}

Previous Month:
- Total: Rp ${previousMonth.total.toLocaleString('id-ID')}
- Categories: ${JSON.stringify(previousMonth.categories, null, 2)}
- Transactions: ${previousMonth.count}

Provide concise insights in Indonesian with these sections:
1. 🎯 Key Trend (1 sentence about overall spending change)
2. ⚠️ Notable Pattern (1 sentence about unusual category changes, if any)
3. 💡 Recommendations (2 actionable tips)
4. 📊 Category Highlight (biggest percentage change)

Keep it brief, friendly, and actionable. Use emoji. Format as plain text, not markdown.`;

        const result = await gemini.model.generateContent(prompt);
        const response = await result.response;
        const insights = response.text();

        console.log('✅ AI Insights generated successfully');
        return insights.trim();

    } catch (error) {
        console.error('Error generating AI insights:', error);

        // Fallback to basic insights
        return generateBasicInsights(currentMonth, previousMonth);
    }
}

/**
 * Generate basic insights without AI (fallback)
 */
function generateBasicInsights(currentMonth, previousMonth) {
    const change = previousMonth.total > 0
        ? ((currentMonth.total - previousMonth.total) / previousMonth.total * 100).toFixed(1)
        : 0;

    let insights = '';

    // Key trend
    if (Math.abs(change) < 5) {
        insights += `🎯 Pengeluaran relatif stabil bulan ini\n\n`;
    } else if (change > 0) {
        insights += `🎯 Pengeluaran naik ${change}% dibanding bulan lalu\n\n`;
    } else {
        insights += `🎯 Pengeluaran turun ${Math.abs(change)}% - bagus! 👍\n\n`;
    }

    // Find biggest category change
    let biggestChange = { category: null, change: 0 };
    for (const cat in currentMonth.categories) {
        const current = currentMonth.categories[cat];
        const previous = previousMonth.categories[cat] || 0;
        const catChange = previous > 0 ? ((current - previous) / previous * 100) : 0;

        if (Math.abs(catChange) > Math.abs(biggestChange.change)) {
            biggestChange = { category: cat, change: catChange };
        }
    }

    if (biggestChange.category && Math.abs(biggestChange.change) > 20) {
        insights += `⚠️ ${biggestChange.category} ${biggestChange.change > 0 ? 'naik' : 'turun'} ${Math.abs(biggestChange.change).toFixed(0)}%\n\n`;
    }

    // Simple recommendations
    insights += `💡 Rekomendasi:\n`;
    insights += `• Review kategori dengan pengeluaran terbesar\n`;
    insights += `• Pertahankan kategori yang sudah efisien\n`;

    return insights;
}

/**
 * Detect spending anomalies
 */
function detectAnomalies(transactions, historicalAverage) {
    const anomalies = [];

    transactions.forEach(t => {
        // Check for unusually large transactions
        if (t.amount > historicalAverage * 3) {
            anomalies.push({
                type: 'large_transaction',
                transaction: t,
                message: `Transaksi besar: ${t.category} Rp ${t.amount.toLocaleString('id-ID')}`
            });
        }
    });

    return anomalies;
}

module.exports = {
    generateSpendingInsights,
    generateBasicInsights,
    detectAnomalies
};
