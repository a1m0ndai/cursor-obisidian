import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

export class GoogleCalendarAPI {
    private clientId: string;
    private clientSecret: string;
    private auth: any;
    private calendar: any;

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    async initialize() {
        if (!this.auth) {
            this.auth = await authenticate({
                keyfilePath: 'credentials.json',
                scopes: ['https://www.googleapis.com/auth/calendar'],
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });

            this.calendar = google.calendar({ version: 'v3', auth: this.auth });
        }
    }

    async addEvent(content: string, reminderTime?: string) {
        await this.initialize();

        // 日付と時間の抽出（簡易的な実装）
        const dateMatch = content.match(/(\d{4}年\d{1,2}月\d{1,2}日)/);
        const timeMatch = content.match(/(\d{1,2}:\d{2})/);
        const titleMatch = content.match(/^# (.+)$/m);

        if (!dateMatch || !timeMatch || !titleMatch) {
            throw new Error('予定の日付、時間、またはタイトルが見つかりません');
        }

        const date = dateMatch[1].replace(/年|月|日/g, '-');
        const time = timeMatch[1];
        const title = titleMatch[1];

        const event = {
            summary: title,
            start: {
                dateTime: `${date}T${time}:00+09:00`,
                timeZone: 'Asia/Tokyo',
            },
            end: {
                dateTime: `${date}T${time}:00+09:00`,
                timeZone: 'Asia/Tokyo',
            },
            description: content,
            reminders: {
                useDefault: false,
                overrides: [
                    {
                        method: 'email',
                        minutes: 24 * 60 // 1日前
                    },
                    {
                        method: 'popup',
                        minutes: 30 // 30分前
                    }
                ]
            }
        };

        // リマインダー時間が指定されている場合、追加のリマインダーを設定
        if (reminderTime) {
            const reminderDate = new Date(reminderTime);
            const eventDate = new Date(`${date}T${time}:00+09:00`);
            const minutesDiff = Math.floor((eventDate.getTime() - reminderDate.getTime()) / (1000 * 60));
            
            if (minutesDiff > 0) {
                event.reminders.overrides.push({
                    method: 'popup',
                    minutes: minutesDiff
                });
            }
        }

        try {
            await this.calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
        } catch (error) {
            console.error('Google Calendar API Error:', error);
            throw new Error('カレンダーへの予定の追加に失敗しました');
        }
    }

    async addReminder(title: string, description: string, reminderTime: string) {
        await this.initialize();

        const event = {
            summary: title,
            start: {
                dateTime: reminderTime,
                timeZone: 'Asia/Tokyo',
            },
            end: {
                dateTime: reminderTime,
                timeZone: 'Asia/Tokyo',
            },
            description: description,
            reminders: {
                useDefault: false,
                overrides: [
                    {
                        method: 'email',
                        minutes: 24 * 60 // 1日前
                    },
                    {
                        method: 'popup',
                        minutes: 30 // 30分前
                    }
                ]
            }
        };

        try {
            await this.calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
        } catch (error) {
            console.error('Google Calendar API Error:', error);
            throw new Error('リマインダーの追加に失敗しました');
        }
    }
} 