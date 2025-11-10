// AI Assistant Service
class AIAssistant {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://api.openai.com/v1/chat/completions';
    }

    // Initialize AI with system prompt
    async initialize() {
        this.systemPrompt = `You are an AI assistant that helps with web development.
Your tasks include:
- Analyzing website layouts and suggesting improvements
- Generating optimized HTML/CSS/JS code
- Providing SEO recommendations
- Creating responsive designs
- Optimizing performance
Please provide practical, modern, and efficient solutions.`;
    }

    // Generate layout suggestions based on content
    async analyzeLayout(content) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Analyze this content and suggest an optimal layout structure:\n${content}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Layout analysis error:', error);
            throw error;
        }
    }

    // Generate optimized code based on requirements
    async generateCode(requirements) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Generate optimized code for these requirements:\n${requirements}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Code generation error:', error);
            throw error;
        }
    }

    // Analyze SEO and provide recommendations
    async analyzeSEO(url, content) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Analyze SEO for URL ${url} with content:\n${content}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('SEO analysis error:', error);
            throw error;
        }
    }

    // Generate responsive design suggestions
    async suggestResponsiveDesign(content) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Suggest responsive design improvements for:\n${content}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Responsive design suggestion error:', error);
            throw error;
        }
    }

    // Analyze performance and suggest optimizations
    async analyzePerformance(metrics) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Analyze performance metrics and suggest optimizations:\n${JSON.stringify(metrics)}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Performance analysis error:', error);
            throw error;
        }
    }

    // Generate image optimization suggestions
    async optimizeImages(images) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Suggest image optimizations for:\n${JSON.stringify(images)}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Image optimization error:', error);
            throw error;
        }
    }

    // Generate accessibility recommendations
    async analyzeAccessibility(content) {
        try {
            const response = await this.callAPI({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: `Analyze accessibility and provide recommendations for:\n${content}` }
                ]
            });
            return this.parseResponse(response);
        } catch (error) {
            console.error('Accessibility analysis error:', error);
            throw error;
        }
    }

    // Call OpenAI API
    async callAPI(payload) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: payload.messages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    // Parse API response
    parseResponse(response) {
        try {
            if (response.choices && response.choices[0] && response.choices[0].message) {
                return response.choices[0].message.content;
            }
            throw new Error('Invalid API response format');
        } catch (error) {
            console.error('Response parsing error:', error);
            throw error;
        }
    }

    // Utility method to sanitize input
    sanitizeInput(input) {
        if (typeof input === 'string') {
            // Remove any potentially harmful characters
            return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                       .replace(/javascript:/gi, '')
                       .replace(/on\w+=/gi, '')
                       .trim();
        } else if (typeof input === 'object') {
            // Recursively sanitize object properties
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }

    // Utility method to validate API response
    validateResponse(response) {
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format');
        }
        if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
            throw new Error('No choices in response');
        }
        return true;
    }

    // Method to handle rate limiting
    async handleRateLimiting(retryAfter = 1000) {
        return new Promise(resolve => setTimeout(resolve, retryAfter));
    }

    // Method to batch process multiple requests
    async batchProcess(requests, batchSize = 3) {
        const results = [];
        for (let i = 0; i < requests.length; i += batchSize) {
            const batch = requests.slice(i, i + batchSize);
            const batchPromises = batch.map(req => this.callAPI(req));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            if (i + batchSize < requests.length) {
                await this.handleRateLimiting();
            }
        }
        return results;
    }
}

// Export AI Assistant
export { AIAssistant };