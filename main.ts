import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import type { Plugin } from 'obsidian';
import { GoogleCalendarAPI } from './googleCalendar';
import { GeminiAPI } from './gemini';
import { TagManager } from './tagManager';

interface ScheduleManagerSettings {
    geminiApiKey: string;
    googleClientId: string;
    googleClientSecret: string;
    autoTagging: boolean;
}

const DEFAULT_SETTINGS: ScheduleManagerSettings = {
    geminiApiKey: '',
    googleClientId: '',
    googleClientSecret: '',
    autoTagging: true
};

export default class ScheduleManagerPlugin extends Plugin {
    settings: ScheduleManagerSettings;
    calendarAPI: GoogleCalendarAPI;
    geminiAPI: GeminiAPI;
    tagManager: TagManager;

    async onload() {
        await this.loadSettings();

        // APIの初期化
        this.calendarAPI = new GoogleCalendarAPI(
            this.settings.googleClientId,
            this.settings.googleClientSecret
        );
        this.geminiAPI = new GeminiAPI(this.settings.geminiApiKey);
        this.tagManager = new TagManager();

        // コマンドの登録
        this.addCommand({
            id: 'sync-to-calendar',
            name: '予定をカレンダーに同期',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    const content = await this.app.vault.read(activeFile);
                    try {
                        await this.calendarAPI.addEvent(content);
                        this.app.notice('予定をカレンダーに同期しました');
                    } catch (error) {
                        this.app.notice('エラーが発生しました: ' + (error as Error).message);
                    }
                }
            }
        });

        this.addCommand({
            id: 'analyze-content',
            name: '内容をGeminiで分析',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    const content = await this.app.vault.read(activeFile);
                    try {
                        const analysis = await this.geminiAPI.analyzeContent(content);
                        // 分析結果を新しいノートとして作成
                        const analysisNote = `# ${activeFile.basename}の分析\n\n${analysis}`;
                        await this.app.vault.create(
                            `${activeFile.basename}_analysis.md`,
                            analysisNote
                        );
                        this.app.notice('内容を分析しました');
                    } catch (error) {
                        this.app.notice('エラーが発生しました: ' + (error as Error).message);
                    }
                }
            }
        });

        this.addCommand({
            id: 'add-reminder',
            name: 'リマインダーを追加',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    const content = await this.app.vault.read(activeFile);
                    try {
                        // Gemini APIでリマインダー情報を生成
                        const reminderInfo = await this.geminiAPI.generateReminder(content);
                        
                        // カレンダーにリマインダーを追加
                        await this.calendarAPI.addReminder(
                            reminderInfo.title,
                            reminderInfo.description,
                            reminderInfo.reminderTime
                        );
                        
                        this.app.notice('リマインダーを追加しました');
                    } catch (error) {
                        this.app.notice('エラーが発生しました: ' + (error as Error).message);
                    }
                }
            }
        });

        this.addCommand({
            id: 'auto-tag',
            name: '自動タグ付け',
            callback: async () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    const content = await this.app.vault.read(activeFile);
                    try {
                        const tags = await this.tagManager.analyzeAndTagContent(content);
                        const formattedTags = this.tagManager.formatTagsForFrontmatter(tags);
                        
                        // フロントマターの更新
                        const updatedContent = this.updateFrontmatterTags(content, formattedTags);
                        await this.app.vault.modify(activeFile, updatedContent);
                        
                        this.app.notice('タグを更新しました');
                    } catch (error) {
                        this.app.notice('エラーが発生しました: ' + (error as Error).message);
                    }
                }
            }
        });

        // 設定タブの追加
        this.addSettingTab(new ScheduleManagerSettingTab(this.app, this));

        // ファイル保存時の自動タグ付け
        if (this.settings.autoTagging) {
            this.registerEvent(
                this.app.vault.on('modify', async (file: TFile) => {
                    if (file instanceof TFile) {
                        const content = await this.app.vault.read(file);
                        try {
                            const tags = await this.tagManager.analyzeAndTagContent(content);
                            const formattedTags = this.tagManager.formatTagsForFrontmatter(tags);
                            const updatedContent = this.updateFrontmatterTags(content, formattedTags);
                            await this.app.vault.modify(file, updatedContent);
                        } catch (error) {
                            console.error('自動タグ付けエラー:', error);
                        }
                    }
                })
            );
        }
    }

    private updateFrontmatterTags(content: string, tags: string): string {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);

        if (match) {
            // 既存のフロントマターがある場合
            const frontmatter = match[1];
            const updatedFrontmatter = frontmatter.replace(
                /tags:.*$/m,
                `tags: ${tags}`
            ) || `${frontmatter}\ntags: ${tags}`;
            return content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
        } else {
            // フロントマターがない場合
            return `---\ntags: ${tags}\n---\n\n${content}`;
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ScheduleManagerSettingTab extends PluginSettingTab {
    plugin: ScheduleManagerPlugin;

    constructor(app: App, plugin: ScheduleManagerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Gemini APIのキーを入力してください')
            .addText((text: any) => text
                .setPlaceholder('API Key')
                .setValue(this.plugin.settings.geminiApiKey)
                .onChange(async (value: string) => {
                    this.plugin.settings.geminiApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Client ID')
            .setDesc('Google Cloud Consoleで取得したClient IDを入力してください')
            .addText((text: any) => text
                .setPlaceholder('Client ID')
                .setValue(this.plugin.settings.googleClientId)
                .onChange(async (value: string) => {
                    this.plugin.settings.googleClientId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Google Client Secret')
            .setDesc('Google Cloud Consoleで取得したClient Secretを入力してください')
            .addText((text: any) => text
                .setPlaceholder('Client Secret')
                .setValue(this.plugin.settings.googleClientSecret)
                .onChange(async (value: string) => {
                    this.plugin.settings.googleClientSecret = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('自動タグ付け')
            .setDesc('ファイル保存時に自動的にタグを付ける')
            .addToggle((toggle: any) => toggle
                .setValue(this.plugin.settings.autoTagging)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.autoTagging = value;
                    await this.plugin.saveSettings();
                }));
    }
} 