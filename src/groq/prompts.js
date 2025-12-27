/**
 * AI prompts untuk Groq
 */

const RECEIPT_OCR_PROMPT = `Analyze this receipt image and extract financial information.

Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "nama toko/restaurant",
  "totalAmount": numeric value only (no currency symbols),
  "items": [
    {"name": "item name", "price": numeric value, "quantity": number}
  ],
  "date": "YYYY-MM-DD format if visible, or null",
  "category": "best matching category from: MAKANAN, TRANSPORT, BELANJA, TAGIHAN, HIBURAN, KESEHATAN, PENDIDIKAN, PAKAIAN, LAINNYA",
  "confidence": number between 0-1
}

If you cannot read the receipt clearly, set confidence to 0.5 or lower.
Extract all readable items. If date is not visible, set to null.
Important: Return ONLY the JSON, no additional text or explanation.`;

const EXPENSE_PARSING_PROMPT = `Extract expense/income information from this text.

Text: {text}

Return ONLY a valid JSON object with this structure:
{
  "type": "expense" or "income",
  "amount": numeric value only,
  "category": "best matching category",
  "description": "brief description",
  "confidence": number between 0-1
}

For expenses, categories: MAKANAN, TRANSPORT, BELANJA, TAGIHAN, HIBURAN, KESEHATAN, PENDIDIKAN, PAKAIAN, LAINNYA
For income, categories: GAJI, FREELANCE, BISNIS, INVESTASI, HADIAH, LAINNYA

Examples:
- "makan siang 50000" -> {"type":"expense","amount":50000,"category":"MAKANAN","description":"makan siang","confidence":0.9}
- "bensin 100rb" -> {"type":"expense","amount":100000,"category":"TRANSPORT","description":"bensin","confidence":0.9}
- "gaji bulan ini 5 juta" -> {"type":"income","amount":5000000,"category":"GAJI","description":"gaji bulan ini","confidence":0.9}

Return ONLY the JSON, no additional text.`;

const VOICE_EXPENSE_PROMPT = `This is a voice transcription about an expense or income.

Transcription: {transcription}

Extract the financial information and return ONLY a valid JSON object:
{
  "type": "expense" or "income",
  "amount": numeric value,
  "category": "best matching category",
  "description": "what was said",
  "confidence": number between 0-1
}

Common Indonesian phrases:
- "pengeluaran untuk X sebesar Y" = expense
- "pemasukan dari X sebesar Y" = income
- "bayar X sekian rupiah" = expense
- "dapat/terima X dari Y" = income

Return ONLY the JSON, no additional text.`;

module.exports = {
    RECEIPT_OCR_PROMPT,
    EXPENSE_PARSING_PROMPT,
    VOICE_EXPENSE_PROMPT
};
