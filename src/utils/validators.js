/**
 * Validation utilities untuk transaction data
 */

/**
 * Validate dan clean amount
 */
function validateAmount(amount) {
    if (typeof amount === 'number') {
        return amount > 0 ? amount : null;
    }

    if (typeof amount === 'string') {
        // Remove currency symbols and separators
        const cleaned = amount.replace(/[Rp.,\s]/g, '');
        const parsed = parseFloat(cleaned);

        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return null;
}

/**
 * Parse amount dari text Indonesia
 * Contoh: "lima ribu" -> 5000, "50rb" -> 50000
 */
function parseIndonesianAmount(text) {
    const lowerText = text.toLowerCase();

    // Parse number words
    const numberWords = {
        'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
        'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9,
        'sepuluh': 10, 'sebelas': 11, 'seratus': 100, 'seribu': 1000
    };

    const multipliers = {
        'ribu': 1000, 'rb': 1000, 'rbu': 1000, 'k': 1000,
        'juta': 1000000, 'jt': 1000000, 'm': 1000000,
        'miliar': 1000000000, 'milyar': 1000000000, 'b': 1000000000
    };

    // Try direct number first
    const directMatch = lowerText.match(/[\d,\.]+/);
    if (directMatch) {
        return validateAmount(directMatch[0]);
    }

    // Try word parsing
    let total = 0;
    let current = 0;

    const words = lowerText.split(/\s+/);

    for (const word of words) {
        if (numberWords[word]) {
            current = current === 0 ? numberWords[word] : current + numberWords[word];
        } else if (multipliers[word]) {
            current = current === 0 ? 1 : current;
            total += current * multipliers[word];
            current = 0;
        }
    }

    total += current;
    return total > 0 ? total : null;
}

/**
 * Validate date
 */
function validateDate(dateInput) {
    if (dateInput instanceof Date) {
        return dateInput;
    }

    if (typeof dateInput === 'string') {
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return new Date(); // Default to now
}

/**
 * Validate transaction object
 */
function validateTransaction(transaction) {
    const errors = [];

    if (!transaction.type || !['expense', 'income'].includes(transaction.type)) {
        errors.push('Type harus "expense" atau "income"');
    }

    const amount = validateAmount(transaction.amount);
    if (!amount) {
        errors.push('Amount harus berupa angka positif');
    }

    if (!transaction.category) {
        errors.push('Category harus diisi');
    }

    return {
        valid: errors.length === 0,
        errors,
        cleanedData: {
            ...transaction,
            amount,
            date: validateDate(transaction.date)
        }
    };
}

module.exports = {
    validateAmount,
    parseIndonesianAmount,
    validateDate,
    validateTransaction
};
