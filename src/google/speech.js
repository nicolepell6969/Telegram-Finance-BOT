const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

class GoogleSpeechClient {
    constructor() {
        // Use same service account as Gemini/Sheets
        this.client = new speech.SpeechClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json'
        });
    }

    /**
     * Transcribe voice message to text
     * @param {string} audioFilePath - Path to audio file (OGG from Telegram)
     * @returns {Promise<string>} Transcribed text
     */
    async transcribeAudio(audioFilePath) {
        try {
            // Read audio file
            const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

            // Configure audio
            const audio = {
                content: audioBytes
            };

            // Configure request
            const config = {
                encoding: 'OGG_OPUS', // Telegram voice format
                sampleRateHertz: 48000, // Standard for Telegram
                languageCode: 'id-ID', // Indonesian
                alternativeLanguageCodes: ['en-US'], // Fallback to English
                enableAutomaticPunctuation: true,
                model: 'default' // or 'command_and_search' for short audio
            };

            const request = {
                audio: audio,
                config: config
            };

            // Perform transcription
            console.log('🎤 Transcribing audio with Google Speech-to-Text...');
            const [response] = await this.client.recognize(request);

            if (!response.results || response.results.length === 0) {
                throw new Error('No transcription results');
            }

            // Get best transcription
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            const confidence = response.results[0].alternatives[0].confidence || 0;

            console.log(`✅ Transcription successful (confidence: ${(confidence * 100).toFixed(1)}%):`, transcription);

            return transcription;

        } catch (error) {
            console.error('Error transcribing audio with Google STT:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    /**
     * Transcribe audio buffer directly
     * @param {Buffer} audioBuffer - Audio buffer
     * @returns {Promise<string>} Transcribed text
     */
    async transcribeBuffer(audioBuffer) {
        try {
            const audio = {
                content: audioBuffer.toString('base64')
            };

            const config = {
                encoding: 'OGG_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'id-ID',
                alternativeLanguageCodes: ['en-US'],
                enableAutomaticPunctuation: true
            };

            const request = {
                audio: audio,
                config: config
            };

            console.log('🎤 Transcribing audio buffer with Google Speech-to-Text...');
            const [response] = await this.client.recognize(request);

            if (!response.results || response.results.length === 0) {
                throw new Error('No transcription results');
            }

            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            console.log('✅ Transcription successful:', transcription);

            return transcription;

        } catch (error) {
            console.error('Error transcribing buffer with Google STT:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }

    /**
     * Test connection to Google Speech-to-Text
     */
    async testConnection() {
        try {
            // Just verify client can be created
            return this.client !== null;
        } catch (error) {
            console.error('Google STT connection test failed:', error);
            return false;
        }
    }
}

module.exports = GoogleSpeechClient;
