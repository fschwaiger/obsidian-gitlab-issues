import { App, normalizePath, PluginSettingTab, Setting } from "obsidian";
import GitlabIssuesPlugin from "../main";
import { settings } from "./settings";
import { GitlabRefreshInterval } from "./settings-types";

export class GitlabIssuesSettingTab extends PluginSettingTab {
	plugin: GitlabIssuesPlugin;

	constructor(app: App, plugin: GitlabIssuesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		const {
			settingInputs,
			dropdowns,
			checkBoxInputs,
			gitlabDocumentation,
			title,
		} = settings;

		containerEl.empty();
		containerEl.createEl("h2", { text: title });

		settingInputs.forEach((setting) => {
			const handleSetValue = () => {
				if (setting.modifier === "normalizePath") {
					return normalizePath(
						this.plugin.settings[setting.value] as string
					);
				}
				if (setting.value === "sources") {
					return JSON.stringify(
						this.plugin.settings.sources || [],
						null,
						2
					);
				}
				return this.plugin.settings[setting.value];
			};

			const newSetting = new Setting(containerEl)
				.setName(setting.title)
				.setDesc(setting.description);

			if (setting.value === "sources") {
				// Render sources as editable JSON
				const current = this.plugin.settings.sources || [];
				newSetting.addTextArea((ta) =>
					ta
						.setPlaceholder(
							'[{"gitlabUrl":"https://gitlab.com","gitlabIssuesLevel":"personal","gitlabAppId":"","gitlabToken":"","filter":"due_date=month"}]'
						)
						.setValue(JSON.stringify(current, null, 2))
						.onChange(async (value) => {
							try {
								const parsed = JSON.parse(value || "null");
								if (!Array.isArray(parsed)) {
									newSetting.setDesc(
										"Invalid JSON: expected an array of sources"
									);
									return;
								}
								// Optionally, could validate shape here; for now accept as-is
								(this.plugin.settings as any).sources = parsed;
								await this.plugin.saveSettings();
								newSetting.setDesc(setting.description);
							} catch (err) {
								newSetting.setDesc(
									"Invalid JSON: " + (err as Error).message
								);
							}
						})
				);
			} else {
				newSetting.addText((text) =>
					text
						.setPlaceholder(setting.placeholder ?? "")
						.setValue(handleSetValue())
						.onChange(async (value) => {
							if (setting.modifier === "normalizePath") {
								(this.plugin.settings as any)[setting.value] =
									normalizePath(value);
							} else {
								(this.plugin.settings as any)[setting.value] =
									value;
							}
							await this.plugin.saveSettings();
						})
				);
			}
		});

		// Only a refresh-interval dropdown remains at the top-level
		dropdowns.forEach((dropwdown) => {
			const currentValue = dropwdown.value;

			new Setting(containerEl)
				.setName(dropwdown.title)
				.setDesc(dropwdown.description)
				.addDropdown((value) =>
					value
						.addOptions(dropwdown.options)
						.setValue(this.plugin.settings[currentValue])
						.onChange(async (value) => {
							this.plugin.settings[currentValue] =
								value as GitlabRefreshInterval;
							this.plugin.scheduleAutomaticRefresh();
							await this.plugin.saveSettings();
							this.display();
						})
				);
		});

		// Note: issue-level and appId are configured per-source in `sources` (UI for editing sources not implemented yet)
		checkBoxInputs.forEach((checkboxSetting) => {
			new Setting(containerEl)
				.setName(checkboxSetting.title)
				.addToggle((value) =>
					value
						.setValue(this.plugin.settings[checkboxSetting.value])
						.onChange(async (value) => {
							this.plugin.settings[checkboxSetting.value] = value;
							await this.plugin.saveSettings();
						})
				);
		});

		containerEl.createEl("h3", { text: "More Information" });
		containerEl.createEl("a", {
			text: gitlabDocumentation.title,
			href: gitlabDocumentation.url,
		});
	}
}
