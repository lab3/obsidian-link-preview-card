import { App, PluginSettingTab, Setting } from "obsidian";
import type LinkPreviewPlugin from "./main";

export interface LinkPreviewSettings {
    defaultCollapsed: boolean;
    collapsedUrls: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: LinkPreviewSettings = {
    defaultCollapsed: false,
    collapsedUrls: {},
};

export class LinkPreviewSettingTab extends PluginSettingTab {
    plugin: LinkPreviewPlugin;

    constructor(app: App, plugin: LinkPreviewPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Collapse previews by default")
            .setDesc("When enabled, link preview cards start collapsed and must be manually expanded.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.defaultCollapsed)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultCollapsed = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
