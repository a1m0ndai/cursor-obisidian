export class GeminiAPI {
    private apiKey: string;
    private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async analyzeContent(content: string): Promise<string> {
        try {
            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `以下のテキストを分析し、重要なポイントを箇条書きでまとめてください：\n\n${content}`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Gemini APIの呼び出しに失敗しました');
        }
    }
} 