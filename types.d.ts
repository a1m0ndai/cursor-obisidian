declare module 'obsidian' {
    interface App {
        workspace: Workspace;
        vault: Vault;
        notice(message: string): void;
    }

    interface Workspace {
        getActiveFile(): TFile | null;
    }

    interface Vault {
        read(file: TFile): Promise<string>;
        create(path: string, content: string): Promise<TFile>;
        modify(file: TFile, content: string): Promise<void>;
        on(event: string, callback: (file: TFile) => void): void;
    }

    interface TFile {
        basename: string;
    }

    interface Plugin {
        app: App;
        loadData(): Promise<any>;
        saveData(data: any): Promise<void>;
        addCommand(command: Command): void;
        addSettingTab(tab: PluginSettingTab): void;
        registerEvent(event: any): void;
    }

    interface Command {
        id: string;
        name: string;
        callback: () => void;
    }

    class PluginSettingTab {
        constructor(app: App, plugin: Plugin);
        display(): void;
    }

    class Setting {
        constructor(containerEl: HTMLElement);
        setName(name: string): Setting;
        setDesc(desc: string): Setting;
        addText(callback: (text: any) => void): Setting;
        addToggle(callback: (toggle: any) => void): Setting;
    }
} 