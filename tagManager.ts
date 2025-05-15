interface TagCategory {
    name: string;
    subcategories?: TagCategory[];
}

export class TagManager {
    private static readonly TAG_HIERARCHY: TagCategory[] = [
        {
            name: 'concept',
            subcategories: []
        },
        {
            name: 'tutorial',
            subcategories: []
        },
        {
            name: 'project',
            subcategories: []
        },
        {
            name: 'reference',
            subcategories: []
        },
        {
            name: 'idea',
            subcategories: []
        },
        {
            name: 'remind',
            subcategories: [
                { name: 'remind-product' },
                { name: 'remind-clients' },
                { name: 'remind-internal' },
                { name: 'remind-strategy' }
            ]
        },
        {
            name: 'ai',
            subcategories: [
                { name: 'ai-openai' },
                { name: 'ai-anthropic' },
                { name: 'ai-google' },
                { name: 'ai-tools' },
                { name: 'ai-ethics' },
                { name: 'ai-research' }
            ]
        },
        {
            name: 'tech',
            subcategories: [
                { name: 'tech-programming' },
                { name: 'tech-python' },
                { name: 'tech-javascript' },
                { name: 'tech-data' },
                { name: 'tech-cloud' }
            ]
        },
        {
            name: 'business',
            subcategories: [
                { name: 'business-strategy' },
                { name: 'business-management' },
                { name: 'business-ethics' },
                { name: 'business-leadership' }
            ]
        },
        {
            name: 'marketing',
            subcategories: [
                { name: 'marketing-digital' },
                { name: 'marketing-content' },
                { name: 'marketing-analytics' },
                { name: 'marketing-strategy' }
            ]
        },
        {
            name: 'analytics',
            subcategories: [
                { name: 'analytics-data' },
                { name: 'analytics-metrics' },
                { name: 'analytics-reporting' },
                { name: 'analytics-tools' }
            ]
        },
        {
            name: 'design',
            subcategories: [
                { name: 'design-ui' },
                { name: 'design-ux' },
                { name: 'design-graphic' },
                { name: 'design-product' },
                { name: 'design-thinking' }
            ]
        },
        {
            name: 'philosophy',
            subcategories: [
                { name: 'philosophy-ethics' },
                { name: 'philosophy-logic' },
                { name: 'philosophy-mind' }
            ]
        },
        {
            name: 'todo',
            subcategories: []
        },
        {
            name: 'inprogress',
            subcategories: []
        },
        {
            name: 'completed',
            subcategories: []
        },
        {
            name: 'review',
            subcategories: []
        }
    ];

    private static readonly MAX_TAGS = 7;

    async analyzeAndTagContent(content: string): Promise<string[]> {
        const tags: string[] = [];
        const contentLower = content.toLowerCase();

        // 基本カテゴリーのチェック
        for (const category of TagManager.TAG_HIERARCHY) {
            if (this.isContentRelevant(contentLower, category.name)) {
                tags.push(category.name);
                
                // サブカテゴリーのチェック
                if (category.subcategories) {
                    for (const subcategory of category.subcategories) {
                        if (this.isContentRelevant(contentLower, subcategory.name)) {
                            tags.push(subcategory.name);
                        }
                    }
                }
            }
        }

        // タグの数を制限
        return tags.slice(0, TagManager.MAX_TAGS);
    }

    private isContentRelevant(content: string, tag: string): boolean {
        const tagWords = tag.split('-');
        const contentWords = content.split(/\s+/);
        
        // タグの単語がコンテンツに含まれているかチェック
        return tagWords.every(word => 
            contentWords.some(contentWord => 
                contentWord.includes(word) || word.includes(contentWord)
            )
        );
    }

    formatTagsForFrontmatter(tags: string[]): string {
        return tags.map(tag => `#${tag}`).join(' ');
    }
} 