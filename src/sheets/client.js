const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { formatDateForSheet, formatTimeForSheet } = require('../utils/formatters');

class GoogleSheetsClient {
    constructor(credentials, spreadsheetId) {
        this.spreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID;

        // Initialize auth
        let auth;
        if (typeof credentials === 'string') {
            // Path to credentials file
            auth = new google.auth.GoogleAuth({
                keyFile: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else if (typeof credentials === 'object') {
            // Credentials object
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
        } else {
            // Try from environment
            const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

            if (credsPath && fs.existsSync(credsPath)) {
                auth = new google.auth.GoogleAuth({
                    keyFile: credsPath,
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
            } else if (credsJson) {
                auth = new google.auth.GoogleAuth({
                    credentials: JSON.parse(credsJson),
                    scopes: ['https://www.googleapis.com/auth/spreadsheets']
                });
            } else {
                throw new Error('Google credentials not found');
            }
        }

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    /**
     * Initialize spreadsheet dengan sheets dan headers
     */
    async initializeSheet() {
        try {
            // Check if sheets exist
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

            // Create Transactions sheet if not exists
            if (!existingSheets.includes('Transactions')) {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: 'Transactions',
                                    gridProperties: {
                                        frozenRowCount: 1
                                    }
                                }
                            }
                        }]
                    }
                });

                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: 'Transactions!A1:I1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [[
                            'Timestamp',
                            'Date',
                            'Time',
                            'Type',
                            'Category',
                            'Amount',
                            'Description',
                            'User ID',
                            'User Name'
                        ]]
                    }
                });

                // Format header
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [{
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: 0,
                                    endRowIndex: 1
                                },
                                cell: {
                                    userEnteredFormat: {
                                        backgroundColor: { red: 0.2, green: 0.5, blue: 0.8 },
                                        textFormat: {
                                            foregroundColor: { red: 1, green: 1, blue: 1 },
                                            bold: true
                                        }
                                    }
                                },
                                fields: 'userEnteredFormat(backgroundColor,textFormat)'
                            }
                        }]
                    }
                });
            }

            // Create Summary sheet if not exists
            if (!existingSheets.includes('Summary')) {
                await this.createSummarySheet();
            }

            console.log('✅ Google Sheet initialized successfully');
            return true;

        } catch (error) {
            console.error('Error initializing sheet:', error);
            throw error;
        }
    }

    /**
     * Create Summary sheet with formulas, formatting, and charts
     */
    async createSummarySheet() {
        const sheetResponse = await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: 'Summary',
                            gridProperties: {
                                frozenRowCount: 1,
                                columnCount: 10,
                                rowCount: 30
                            },
                            tabColor: {
                                red: 0.2,
                                green: 0.6,
                                blue: 0.9
                            }
                        }
                    }
                }]
            }
        });

        const summarySheetId = sheetResponse.data.replies[0].addSheet.properties.sheetId;

        // Add headers and formulas with better layout
        const summaryData = [
            ['📊 RINGKASAN KEUANGAN', ''],
            [''],
            ['💰 Metric', 'Value'],
            ['Total Pengeluaran', '=SUMIF(Transactions!D:D,"expense",Transactions!F:F)'],
            ['Total Pemasukan', '=SUMIF(Transactions!D:D,"income",Transactions!F:F)'],
            ['💵 Saldo', '=B5-B4'],
            [''],
            ['📊 PENGELUARAN PER KATEGORI', ''],
            ['Kategori', 'Total'],
            ['🍔 MAKANAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"MAKANAN")'],
            ['🚗 TRANSPORT', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"TRANSPORT")'],
            ['🛒 BELANJA', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"BELANJA")'],
            ['💳 TAGIHAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"TAGIHAN")'],
            ['🎬 HIBURAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"HIBURAN")'],
            ['💊 KESEHATAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"KESEHATAN")'],
            ['📚 PENDIDIKAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"PENDIDIKAN")'],
            ['👕 PAKAIAN', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"PAKAIAN")'],
            ['📦 LAINNYA', '=SUMIFS(Transactions!F:F,Transactions!D:D,"expense",Transactions!E:E,"LAINNYA")']
        ];

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Summary!A1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: summaryData
            }
        });

        // Apply formatting
        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            resource: {
                requests: [
                    // Header row (row 1) - Title
                    {
                        repeatCell: {
                            range: {
                                sheetId: summarySheetId,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true,
                                        fontSize: 14
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    // Summary headers (row 3)
                    {
                        repeatCell: {
                            range: {
                                sheetId: summarySheetId,
                                startRowIndex: 2,
                                endRowIndex: 3
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                    textFormat: {
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    // Category headers (row 9)
                    {
                        repeatCell: {
                            range: {
                                sheetId: summarySheetId,
                                startRowIndex: 8,
                                endRowIndex: 9
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                    textFormat: {
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    // Highlight Saldo row (row 6)
                    {
                        repeatCell: {
                            range: {
                                sheetId: summarySheetId,
                                startRowIndex: 5,
                                endRowIndex: 6
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 1, green: 0.95, blue: 0.8 },
                                    textFormat: {
                                        bold: true
                                    }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    // Conditional formatting for expenses (red if > 0)
                    {
                        addConditionalFormatRule: {
                            rule: {
                                ranges: [{
                                    sheetId: summarySheetId,
                                    startRowIndex: 9,
                                    endRowIndex: 18,
                                    startColumnIndex: 1,
                                    endColumnIndex: 2
                                }],
                                gradientRule: {
                                    minpoint: {
                                        color: { red: 1, green: 1, blue: 1 },
                                        type: 'MIN'
                                    },
                                    maxpoint: {
                                        color: { red: 1, green: 0.4, blue: 0.4 },
                                        type: 'MAX'
                                    }
                                }
                            },
                            index: 0
                        }
                    },
                    // Add pie chart for Income vs Expense
                    {
                        addChart: {
                            chart: {
                                spec: {
                                    title: '💰 Income vs Expense',
                                    pieChart: {
                                        domain: {
                                            sourceRange: {
                                                sources: [{
                                                    sheetId: summarySheetId,
                                                    startRowIndex: 3,
                                                    endRowIndex: 5,
                                                    startColumnIndex: 0,
                                                    endColumnIndex: 1
                                                }]
                                            }
                                        },
                                        series: {
                                            sourceRange: {
                                                sources: [{
                                                    sheetId: summarySheetId,
                                                    startRowIndex: 3,
                                                    endRowIndex: 5,
                                                    startColumnIndex: 1,
                                                    endColumnIndex: 2
                                                }]
                                            }
                                        },
                                        legendPosition: 'BOTTOM_LEGEND'
                                    }
                                },
                                position: {
                                    overlayPosition: {
                                        anchorCell: {
                                            sheetId: summarySheetId,
                                            rowIndex: 0,
                                            columnIndex: 3
                                        }
                                    }
                                }
                            }
                        }
                    },
                    // Add bar chart for categories
                    {
                        addChart: {
                            chart: {
                                spec: {
                                    title: '📊 Pengeluaran per Kategori',
                                    basicChart: {
                                        chartType: 'BAR',
                                        axis: [{
                                            position: 'BOTTOM_AXIS',
                                            title: 'Amount (Rp)'
                                        }],
                                        domains: [{
                                            domain: {
                                                sourceRange: {
                                                    sources: [{
                                                        sheetId: summarySheetId,
                                                        startRowIndex: 9,
                                                        endRowIndex: 18,
                                                        startColumnIndex: 0,
                                                        endColumnIndex: 1
                                                    }]
                                                }
                                            }
                                        }],
                                        series: [{
                                            series: {
                                                sourceRange: {
                                                    sources: [{
                                                        sheetId: summarySheetId,
                                                        startRowIndex: 9,
                                                        endRowIndex: 18,
                                                        startColumnIndex: 1,
                                                        endColumnIndex: 2
                                                    }]
                                                }
                                            },
                                            targetAxis: 'BOTTOM_AXIS'
                                        }],
                                        legendPosition: 'NO_LEGEND'
                                    }
                                },
                                position: {
                                    overlayPosition: {
                                        anchorCell: {
                                            sheetId: summarySheetId,
                                            rowIndex: 19,
                                            columnIndex: 0
                                        }
                                    }
                                }
                            }
                        }
                    },
                    // Auto-resize columns
                    {
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: summarySheetId,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: 2
                            }
                        }
                    }
                ]
            }
        });
    }

    /**
     * Add transaction to sheet
     */
    async addTransaction(transaction) {
        try {
            const { type, category, amount, description, userId, userName, date } = transaction;
            const timestamp = date || new Date();

            const row = [
                timestamp.toISOString(),
                formatDateForSheet(timestamp),
                formatTimeForSheet(timestamp),
                type,
                category,
                amount,
                description || '',
                userId || '',
                userName || 'Unknown'
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Transactions!A:I',
                valueInputOption: 'RAW',
                resource: {
                    values: [row]
                }
            });

            console.log(`✅ Transaction added: ${userName} - ${type} ${amount}`);
            return true;

        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    /**
   * Get monthly summary
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @param {string} userId - Optional user ID filter
   */
    async getMonthlyReport(month, year, userId = null) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Transactions!A2:I'
            });

            const rows = response.data.values || [];

            const filtered = rows.filter(row => {
                // Filter by date
                const rowUserId = row[7];
                const date = new Date(row[1]);
                const dateMatch = date.getMonth() + 1 === month && date.getFullYear() === year;

                // Filter by userId if provided
                if (userId) {
                    return dateMatch && String(rowUserId) === String(userId);
                }
                return dateMatch;
            });

            const totalExpense = filtered
                .filter(row => row[3] === 'expense')
                .reduce((sum, row) => sum + parseFloat(row[5] || 0), 0);

            const totalIncome = filtered
                .filter(row => row[3] === 'income')
                .reduce((sum, row) => sum + parseFloat(row[5] || 0), 0);

            // Group by category
            const expenseByCategory = {};
            filtered
                .filter(row => row[3] === 'expense')
                .forEach(row => {
                    const category = row[4];
                    expenseByCategory[category] = (expenseByCategory[category] || 0) + parseFloat(row[5] || 0);
                });

            const expenseByCategoryArray = Object.entries(expenseByCategory)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total);

            return {
                month,
                year,
                totalExpense,
                totalIncome,
                balance: totalIncome - totalExpense,
                transactionCount: filtered.length,
                expenseByCategory: expenseByCategoryArray
            };

        } catch (error) {
            console.error('Error getting monthly report:', error);
            throw error;
        }
    }

    /**
   * Get daily transactions
   * @param {Date} date - Target date
   * @param {string} userId - Optional user ID filter
   */
    async getDailyTransactions(date, userId = null) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Transactions!A2:I'
            });

            const rows = response.data.values || [];
            const targetDate = formatDateForSheet(date);

            const filtered = rows.filter(row => {
                const dateMatch = row[1] === targetDate;
                if (userId) {
                    return dateMatch && String(row[7]) === String(userId);
                }
                return dateMatch;
            });

            const transactions = filtered.map(row => ({
                timestamp: row[0],
                date: row[1],
                time: row[2],
                type: row[3],
                category: row[4],
                amount: parseFloat(row[5] || 0),
                description: row[6] || '',
                userId: row[7] || '',
                userName: row[8] || 'Unknown'
            }));

            const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                date,
                totalExpense,
                totalIncome,
                balance: totalIncome - totalExpense,
                transactions
            };

        } catch (error) {
            console.error('Error getting daily transactions:', error);
            throw error;
        }
    }

    /**
     * Get users who have transactions in a given period
     */
    async getUsersWithTransactions(month, year) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Transactions!A2:I'
            });

            const rows = response.data.values || [];
            const users = new Map();

            rows.forEach(row => {
                const date = new Date(row[1]);
                if (date.getMonth() + 1 === month && date.getFullYear() === year) {
                    const userId = row[7];
                    const userName = row[8] || 'Unknown';
                    if (userId && !users.has(userId)) {
                        users.set(userId, { userId, userName });
                    }
                }
            });

            return Array.from(users.values());
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    /**
     * Get spreadsheet URL
     */
    getSpreadsheetUrl() {
        return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
    }
}

module.exports = GoogleSheetsClient;
