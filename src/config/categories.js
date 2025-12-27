/**
 * Kategori pengeluaran dan pemasukan dengan icons
 */

const EXPENSE_CATEGORIES = {
    MAKANAN: { name: 'Makanan & Minuman', icon: '🍔', keywords: ['makan', 'minum', 'food', 'restaurant', 'cafe', 'warung'] },
    TRANSPORT: { name: 'Transportasi', icon: '🚗', keywords: ['bensin', 'parkir', 'transport', 'ojek', 'grab', 'gojek', 'taxi'] },
    BELANJA: { name: 'Belanja', icon: '🛒', keywords: ['belanja', 'shopping', 'beli', 'indomaret', 'alfamart', 'supermarket'] },
    TAGIHAN: {
        name: 'Tagihan & Utilitas',
        icon: '💳',
        keywords: [
            // Utilities
            'listrik', 'air', 'pdam', 'pln', 'internet', 'wifi', 'indihome', 'tagihan', 'bill',
            // Telco General
            'pulsa', 'paket data', 'kuota', 'telpon', 'sms', 'voucher',
            // Telkomsel
            'telkomsel', 'simpati', 'kartu as', 'loop', 'kartu halo',
            // Indosat Ooredoo
            'indosat', 'ooredoo', 'im3', 'mentari', 'matrix',
            // XL Axiata
            'xl', 'axiata', 'xl axiata', 'prioritas',
            // Tri (3)
            'tri', '3', 'three',
            // Smartfren
            'smartfren', 'andromax',
            // by.U
            'by.u', 'byu', 'by u',
            // Axis
            'axis'
        ]
    },
    HIBURAN: { name: 'Hiburan', icon: '🎬', keywords: ['nonton', 'cinema', 'game', 'hiburan', 'entertainment'] },
    KESEHATAN: { name: 'Kesehatan', icon: '💊', keywords: ['obat', 'dokter', 'rumah sakit', 'klinik', 'apotek', 'health'] },
    PENDIDIKAN: { name: 'Pendidikan', icon: '📚', keywords: ['buku', 'kursus', 'sekolah', 'kuliah', 'education'] },
    PAKAIAN: { name: 'Pakaian', icon: '👕', keywords: ['baju', 'sepatu', 'pakaian', 'fashion', 'clothes'] },
    LAINNYA: { name: 'Lainnya', icon: '📦', keywords: [] }
};

const INCOME_CATEGORIES = {
    GAJI: { name: 'Gaji', icon: '💰', keywords: ['gaji', 'salary', 'payroll'] },
    FREELANCE: { name: 'Freelance', icon: '💻', keywords: ['freelance', 'project', 'contract'] },
    BISNIS: { name: 'Bisnis', icon: '🏢', keywords: ['bisnis', 'usaha', 'business', 'profit'] },
    INVESTASI: { name: 'Investasi', icon: '📈', keywords: ['dividen', 'saham', 'investment', 'return'] },
    HADIAH: { name: 'Hadiah', icon: '🎁', keywords: ['hadiah', 'gift', 'bonus'] },
    LAINNYA: { name: 'Lainnya', icon: '💵', keywords: [] }
};

/**
 * Auto-detect kategori berdasarkan keywords dalam text
 */
function detectCategory(text, type = 'expense') {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const lowerText = text.toLowerCase();

    for (const [key, category] of Object.entries(categories)) {
        if (category.keywords.some(keyword => lowerText.includes(keyword))) {
            return key;
        }
    }

    return type === 'expense' ? 'LAINNYA' : 'LAINNYA';
}

/**
 * Get category display name with icon
 */
function getCategoryDisplay(categoryKey, type = 'expense') {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const category = categories[categoryKey];
    return category ? `${category.icon} ${category.name}` : '📦 Lainnya';
}

/**
 * Get all categories for inline keyboard
 */
function getCategoryOptions(type = 'expense') {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    return Object.entries(categories).map(([key, category]) => ({
        text: `${category.icon} ${category.name}`,
        callback_data: `category_${type}_${key}`
    }));
}

module.exports = {
    EXPENSE_CATEGORIES,
    INCOME_CATEGORIES,
    detectCategory,
    getCategoryDisplay,
    getCategoryOptions
};
