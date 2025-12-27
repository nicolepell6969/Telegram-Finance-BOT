const axios = require('axios');

/**
 * Generate pie chart URL using QuickChart API
 */
function generatePieChartUrl(data, title = 'Chart') {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = data.map(d => d.color || '#3498db');

    const chartConfig = {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            title: {
                display: true,
                text: title,
                fontSize: 16,
                fontColor: '#333'
            },
            legend: {
                position: 'bottom',
                labels: {
                    fontSize: 12,
                    fontColor: '#666'
                }
            },
            plugins: {
                datalabels: {
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    formatter: (value, ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return percentage + '%';
                    }
                }
            }
        }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=500&h=300`;
    return chartUrl;
}

/**
 * Generate bar chart URL
 */
function generateBarChartUrl(data, title = 'Chart', xlabel = '', ylabel = '') {
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = data.map(d => d.color || '#3498db');

    const chartConfig = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: ylabel,
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            title: {
                display: true,
                text: title,
                fontSize: 16
            },
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: (value) => {
                            if (value >= 1000000) return (value / 1000000) + 'M';
                            if (value >= 1000) return (value / 1000) + 'K';
                            return value;
                        }
                    }
                }]
            }
        }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=600&h=400`;
    return chartUrl;
}

/**
 * Download chart image
 */
async function downloadChart(chartUrl) {
    try {
        const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error downloading chart:', error);
        return null;
    }
}

/**
 * Category colors mapping
 */
const CATEGORY_COLORS = {
    // Expense categories
    MAKANAN: '#e74c3c',      // Red
    TRANSPORT: '#3498db',    // Blue  
    BELANJA: '#9b59b6',      // Purple
    TAGIHAN: '#e67e22',      // Orange
    HIBURAN: '#1abc9c',      // Teal
    KESEHATAN: '#2ecc71',    // Green
    PENDIDIKAN: '#f39c12',   // Yellow
    PAKAIAN: '#34495e',      // Dark gray
    LAINNYA: '#95a5a6',      // Gray

    // Income categories
    GAJI: '#27ae60',         // Green
    FREELANCE: '#3498db',    // Blue
    BISNIS: '#8e44ad',       // Purple
    INVESTASI: '#16a085',    // Teal
    HADIAH: '#f39c12',       // Orange
};

function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || '#95a5a6';
}

module.exports = {
    generatePieChartUrl,
    generateBarChartUrl,
    downloadChart,
    getCategoryColor,
    CATEGORY_COLORS
};
