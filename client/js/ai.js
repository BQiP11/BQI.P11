// AI integration module
class AI {
    constructor() {
        this.apiKey = ''; // Add your OpenAI API key
        this.apiEndpoint = 'https://api.openai.com/v1';
        this.setupCache();
    }

    // Initialize cache for API responses
    setupCache() {
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    // Content analysis
    async analyzeContent(text) {
        const cacheKey = `analyze_${text}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.makeRequest('/completions', {
                model: 'text-davinci-003',
                prompt: `Analyze this content and provide insights: ${text}`,
                max_tokens: 150,
                temperature: 0.7
            });

            const result = {
                sentiment: this.analyzeSentiment(text),
                topics: this.extractTopics(response.choices[0].text),
                suggestions: this.generateSuggestions(response.choices[0].text)
            };

            this.cache.set(cacheKey, result);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

            return result;
        } catch (error) {
            console.error('Content analysis failed:', error);
            throw new Error('Failed to analyze content');
        }
    }

    // Generate image
    async generateImage(prompt) {
        const cacheKey = `image_${prompt}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.makeRequest('/images/generations', {
                prompt,
                n: 1,
                size: '512x512',
                response_format: 'url'
            });

            const imageUrl = response.data[0].url;
            this.cache.set(cacheKey, imageUrl);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

            return imageUrl;
        } catch (error) {
            console.error('Image generation failed:', error);
            throw new Error('Failed to generate image');
        }
    }

    // Get content suggestions
    async getSuggestions(text) {
        const cacheKey = `suggest_${text}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.makeRequest('/completions', {
                model: 'text-davinci-003',
                prompt: `Suggest improvements for this content: ${text}`,
                max_tokens: 100,
                temperature: 0.6
            });

            const suggestions = this.parseSuggestions(response.choices[0].text);
            this.cache.set(cacheKey, suggestions);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

            return suggestions;
        } catch (error) {
            console.error('Getting suggestions failed:', error);
            throw new Error('Failed to get suggestions');
        }
    }

    // Get real-time suggestions
    async getRealtimeSuggestion(text) {
        // Use a faster model for real-time suggestions
        try {
            const response = await this.makeRequest('/completions', {
                model: 'text-davinci-003',
                prompt: `Complete this text naturally: ${text}`,
                max_tokens: 50,
                temperature: 0.4
            });

            return response.choices[0].text.trim();
        } catch (error) {
            console.error('Real-time suggestion failed:', error);
            return null;
        }
    }

    // Enhance image
    async enhanceImage(imageBlob) {
        // Convert blob to base64
        const base64Image = await this.blobToBase64(imageBlob);

        try {
            const response = await this.makeRequest('/images/variations', {
                image: base64Image,
                n: 1,
                size: '512x512',
                response_format: 'url'
            });

            const enhancedImageUrl = response.data[0].url;
            return this.urlToBlob(enhancedImageUrl);
        } catch (error) {
            console.error('Image enhancement failed:', error);
            return imageBlob; // Return original if enhancement fails
        }
    }

    // Extract text from image
    async extractTextFromImage(imageBlob) {
        const base64Image = await this.blobToBase64(imageBlob);

        try {
            const response = await this.makeRequest('/images/ocr', {
                image: base64Image,
                model: 'text-recognition-003'
            });

            return response.text;
        } catch (error) {
            console.error('Text extraction failed:', error);
            throw new Error('Failed to extract text from image');
        }
    }

    // Analyze sentiment
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love'];
        const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'sad', 'hate'];

        const words = text.toLowerCase().split(/\W+/);
        let score = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    // Extract topics
    extractTopics(text) {
        const topics = new Set();
        const words = text.toLowerCase().split(/\W+/);
        
        // Simple topic extraction based on word frequency
        const wordCount = {};
        words.forEach(word => {
            if (word.length > 3) { // Ignore short words
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });

        // Get top 3 most frequent words as topics
        Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .forEach(([word]) => topics.add(word));

        return Array.from(topics);
    }

    // Generate content suggestions
    generateSuggestions(analysis) {
        const suggestions = [];

        // Parse analysis and generate suggestions
        const lines = analysis.split('\n').filter(line => line.trim());
        lines.forEach(line => {
            if (line.includes('suggest') || line.includes('recommend')) {
                suggestions.push(line.trim());
            }
        });

        return suggestions;
    }

    // Parse suggestions from AI response
    parseSuggestions(text) {
        return text
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, ''));
    }

    // Make API request
    async makeRequest(endpoint, data) {
        try {
            const response = await fetch(this.apiEndpoint + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Utility: Convert blob to base64
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    // Utility: Convert URL to blob
    async urlToBlob(url) {
        const response = await fetch(url);
        return response.blob();
    }
}

// Export AI instance
export const ai = new AI();