/**
 * Command to recreate Summary sheet with formatting and charts
 * Use this if Summary sheet exists without formatting
 */
async function recreateSummarySheet(sheetsClient) {
    try {
        // Get current spreadsheet
        const spreadsheet = await sheetsClient.sheets.spreadsheets.get({
            spreadsheetId: sheetsClient.spreadsheetId
        });

        const existingSheets = spreadsheet.data.sheets || [];
        const summarySheet = existingSheets.find(s => s.properties.title === 'Summary');

        if (summarySheet) {
            // Delete existing Summary sheet
            await sheetsClient.sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetsClient.spreadsheetId,
                resource: {
                    requests: [{
                        deleteSheet: {
                            sheetId: summarySheet.properties.sheetId
                        }
                    }]
                }
            });
            console.log('✅ Deleted old Summary sheet');
        }

        // Create new formatted Summary sheet
        await sheetsClient.createSummarySheet();
        console.log('✅ Created new formatted Summary sheet with charts');

        return true;
    } catch (error) {
        console.error('Error recreating Summary sheet:', error);
        throw error;
    }
}

module.exports = {
    recreateSummarySheet
};
