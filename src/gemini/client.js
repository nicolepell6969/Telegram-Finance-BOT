const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiClient {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });
    }

    /**
     * Analyze receipt image using Gemini Vision
     * @param {Buffer} imageBuffer - Image buffer
     * @returns {Promise<Object>} Parsed receipt data
     */
    async analyzeReceipt(imageBuffer) {
        try {
            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            };

            const prompt = `Analyze this Indonesian receipt/struk belanja and extract the following information.

IMPORTANT: Return ONLY a valid JSON object, no other text.

Extract:
1. merchant: Name of the store/merchant (string)
2. totalAmount: Total payment amount in numbers only (number, no currency symbol)
3. items: Array of items purchased, each with:
   - name: item name (string)
   - price: item price (number)
   - quantity: quantity if visible (number, default 1)
4. date: Transaction date if visible (YYYY-MM-DD format or null)
5. category: Best matching category from: MAKANAN, TRANSPORT, BELANJA, TAGIHAN, HIBURAN, KESEHATAN, PENDIDIKAN, PAKAIAN, LAINNYA
6. confidence: Your confidence level 0.0-1.0 (number)

Example output:
{
  "merchant": "Alfamart",
  "totalAmount": 85000,
  "items": [
    {"name": "Indomie Goreng", "price": 3500, "quantity": 10},
    {"name": "Air Mineral", "price": 5000, "quantity": 10}
  ],
  "date": "2025-12-26",
  "category": "BELANJA",
  "confidence": 0.95
}

Return ONLY the JSON object, nothing else.`;

            const result = await this.model.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // Clean response - remove markdown code blocks if present
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n?/g, '');
            }

            // Parse JSON
            const parsed = JSON.parse(cleanText);

            return {
                merchant: parsed.merchant || 'Unknown',
                totalAmount: parsed.totalAmount || 0,
                items: parsed.items || [],
                date: parsed.date || null,
                category: (parsed.category || 'LAINNYA').toUpperCase(),
                confidence: parsed.confidence || 0.7
            };

        } catch (error) {
            console.error('Error analyzing receipt with Gemini:', error);

            // Return fallback data
            return {
                merchant: 'Unknown',
                totalAmount: 0,
                items: [],
                category: 'LAINNYA',
                confidence: 0.3,
                error: error.message
            };
        }
    }

    /**
     * Parse expense/income from text using Gemini
     * @param {string} text - User input text
     * @returns {Promise<Object>} Parsed transaction data
     */
    async parseExpenseFromText(text) {
        try {
            const prompt = `Analyze this Indonesian text and extract financial transaction information.

Text: "${text}"

Extract and return ONLY a valid JSON object with:
{
  "type": "expense" or "income",
  "amount": number (extract from text, convert Indonesian: ribu=1000, juta=1000000, rb/k=1000),
  "category": best matching category (UPPERCASE) from:
    - Expense: MAKANAN, TRANSPORT, BELANJA, TAGIHAN, HIBURAN, KESEHATAN, PENDIDIKAN, PAKAIAN, LAINNYA
    - Income: GAJI, FREELANCE, BISNIS, INVESTASI, HADIAH, LAINNYA
  "description": brief description from the text,
  "confidence": 0.0-1.0 (how confident you are)
}

Rules:
- Detect "gaji", "bonus", "dapat", "terima" → type: "income"
- Otherwise → type: "expense"
- Auto-detect category from keywords
- Indonesian number format: 50rb = 50000, 5k = 5000, 2jt = 2000000
- Return ONLY JSON, no other text

Example inputs:
- "makan 50000" → {"type":"expense","amount":50000,"category":"MAKANAN","description":"makan","confidence":0.9}
- "gaji 5 juta" → {"type":"income","amount":5000000,"category":"GAJI","description":"gaji","confidence":0.95}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text_response = response.text();

            // Clean response - remove markdown code blocks if present
            let cleanText = text_response.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n?/g, '');
            }

            // Parse JSON
            const parsed = JSON.parse(cleanText);

            return {
                type: parsed.type || 'expense',
                amount: parsed.amount || 0,
                category: (parsed.category || 'LAINNYA').toUpperCase(),
                description: parsed.description || text,
                confidence: parsed.confidence || 0.7
            };

        } catch (error) {
            console.error('Error parsing text with Gemini:', error);

            // Fallback with basic detection
            return {
                type: 'expense',
                amount: 0,
                category: 'LAINNYA',
                description: text,
                confidence: 0.3,
                error: error.message
            };
        }
    }

    /**
     * Test connection to Gemini API
     */
    async testConnection() {
        try {
            const result = await this.model.generateContent("Hello, can you hear me?");
            const response = await result.response;
            return response.text().length > 0;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}

module.exports = GeminiClient;
