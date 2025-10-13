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
				// interactive repeater for sources
				const sourcesContainer = containerEl.createDiv({
					cls: "gitlab-sources-container",
				});

				const renderSources = () => {
					// clear existing
					sourcesContainer.empty();

					const sources = this.plugin.settings.sources || [];

					sources.forEach((src, idx) => {
						const srcDiv = sourcesContainer.createDiv({
							cls: "gitlab-source",
						});

						// header with remove button
						const header = srcDiv.createDiv({
							cls: "gitlab-source-header",
						});
						header.createEl("strong", {
							text: `Source ${idx + 1}`,
						});
						const removeBtn = header.createEl("button", {
							text: "Remove",
						});
						removeBtn.addEventListener("click", async () => {
							(this.plugin.settings.sources as any).splice(
								idx,
								1
							);
							await this.plugin.saveSettings();
							renderSources();
						});

						// gitlabUrl
						new Setting(srcDiv).setName("GitLab URL").addText((t) =>
							t
								.setPlaceholder("https://gitlab.com")
								.setValue(src.gitlabUrl || "")
								.onChange(async (v) => {
									(this.plugin.settings.sources as any)[
										idx
									].gitlabUrl = v;
									await this.plugin.saveSettings();
								})
						);

						// issues level dropdown
						new Setting(srcDiv).setName("Scope").addDropdown((d) =>
							d
								.addOptions({
									personal: "Personal",
									project: "Project",
									group: "Group",
								})
								.setValue(src.gitlabIssuesLevel)
								.onChange(async (v) => {
									(this.plugin.settings.sources as any)[
										idx
									].gitlabIssuesLevel = v as any;
									await this.plugin.saveSettings();
								})
						);

						// app id
						new Setting(srcDiv)
							.setName("App / Project / Group ID")
							.addText((t) =>
								t
									.setPlaceholder(
										"ID (required for project/group)"
									)
									.setValue(src.gitlabAppId || "")
									.onChange(async (v) => {
										(this.plugin.settings.sources as any)[
											idx
										].gitlabAppId = v;
										await this.plugin.saveSettings();
									})
							);

						// token
						new Setting(srcDiv)
							.setName("Personal Access Token")
							.addText((t) =>
								t
									.setPlaceholder("Token (optional)")
									.setValue(src.gitlabToken || "")
									.onChange(async (v) => {
										(this.plugin.settings.sources as any)[
											idx
										].gitlabToken = v;
										await this.plugin.saveSettings();
									})
							);

						// filter
						new Setting(srcDiv)
							.setName("Filter")
							.setDesc(
								"The query string used to filter the issues."
							)
							.addText((t) =>
								t
									.setPlaceholder("due_date=month")
									.setValue(src.filter || "")
									.onChange(async (v) => {
										(this.plugin.settings.sources as any)[
											idx
										].filter = v;
										await this.plugin.saveSettings();
									})
							);
					});

					// add button
					sourcesContainer
						.createEl("div", { cls: "gitlab-source-add" })
						.createEl("button", { text: "Add source" })
						.addEventListener("click", async () => {
							const list = this.plugin.settings.sources || [];
							list.push({
								gitlabUrl: "https://gitlab.com",
								gitlabIssuesLevel: "personal",
								gitlabAppId: "",
								gitlabToken: "",
								filter: "due_date=month",
							});
							(this.plugin.settings as any).sources = list;
							await this.plugin.saveSettings();
							renderSources();
						});
				};

				// initial render
				renderSources();
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
