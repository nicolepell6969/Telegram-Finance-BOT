const Groq = require('groq-sdk');
const fs = require('fs');
const { RECEIPT_OCR_PROMPT, EXPENSE_PARSING_PROMPT, VOICE_EXPENSE_PROMPT } = require('./prompts');

class GroqClient {
    constructor(apiKey) {
        this.client = new Groq({
            apiKey: apiKey || process.env.GROQ_API_KEY
        });
    }

    /**
     * Analyze receipt image - now using Google Gemini Vision
     * @param {Buffer|string} imageInput - Buffer or file path
     * @returns {Promise<Object>} Parsed receipt data
     */
    async analyzeReceipt(imageInput) {
        try {
            // Load Gemini client dynamically
            const GeminiClient = require('../gemini/client');
            const geminiClient = new GeminiClient();

            let imageBuffer;

            if (Buffer.isBuffer(imageInput)) {
                imageBuffer = imageInput;
            } else if (typeof imageInput === 'string') {
                imageBuffer = fs.readFileSync(imageInput);
            } else {
                throw new Error('Invalid image input');
            }

            // Use Gemini for receipt analysis
            const result = await geminiClient.analyzeReceipt(imageBuffer);

            console.log('✅ Gemini Vision analysis successful:', result.merchant, result.totalAmount);

            return result;

        } catch (error) {
            console.error('Error analyzing receipt:', error);
            throw error;
        }
    }

    /**
     * Transcribe voice message using Groq Whisper
     * @param {Buffer|string} audioInput - Buffer or file path
     * @returns {Promise<string>} Transcription text
     */
    async transcribeVoice(audioInput) {
        try {
            let audioFile;

            if (typeof audioInput === 'string') {
                audioFile = fs.createReadStream(audioInput);
            } else if (Buffer.isBuffer(audioInput)) {
                // Write buffer to temp file
                const tempPath = `/tmp/voice_${Date.now()}.ogg`;
                fs.writeFileSync(tempPath, audioInput);
                audioFile = fs.createReadStream(tempPath);
            } else {
                throw new Error('Invalid audio input');
            }

            const response = await this.client.audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3',
                language: 'id', // Indonesian
                response_format: 'json'
            });

            return response.text || '';

        } catch (error) {
            console.error('Error transcribing voice:', error);
            throw error;
        }
    }

    /**
     * Parse expense/income from text using Groq
     * @param {string} text - User input text
     * @returns {Promise<Object>} Parsed transaction data
     */
    async parseExpenseFromText(text) {
        try {
            const prompt = EXPENSE_PARSING_PROMPT.replace('{text}', text);

            const response = await this.client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 512
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Groq');
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('Failed to parse JSON from response:', content);
                return {
                    type: 'expense',
                    amount: 0,
                    category: 'LAINNYA',
                    description: text,
                    confidence: 0.3
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                type: parsed.type || 'expense',
                amount: parsed.amount || 0,
                category: parsed.category || 'LAINNYA',
                description: parsed.description || text,
                confidence: parsed.confidence || 0.5
            };

        } catch (error) {
            console.error('Error parsing text:', error);
            throw error;
        }
    }

    /**
     * Parse expense from voice transcription
     * @param {string} transcription - Voice transcription text
     * @returns {Promise<Object>} Parsed transaction data
     */
    async parseExpenseFromVoice(transcription) {
        try {
            const prompt = VOICE_EXPENSE_PROMPT.replace('{transcription}', transcription);

            const response = await this.client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 512
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Groq');
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    type: 'expense',
                    amount: 0,
                    category: 'LAINNYA',
                    description: transcription,
                    confidence: 0.3
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return {
                type: parsed.type || 'expense',
                amount: parsed.amount || 0,
                category: parsed.category || 'LAINNYA',
                description: parsed.description || transcription,
                confidence: parsed.confidence || 0.5,
                transcription
            };

        } catch (error) {
            console.error('Error parsing voice:', error);
            throw error;
        }
    }
}

module.exports = GroqClient;
