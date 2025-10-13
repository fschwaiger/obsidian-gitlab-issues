import { addIcon, Notice, Plugin } from "obsidian";
import Filesystem from "./filesystem";
import GitlabLoader from "./GitlabLoader/gitlab-loader";
import gitlabIcon from "./assets/gitlab-icon.svg";
import { GitlabIssuesSettingTab } from "./SettingsTab/settings-tab";
import { GitlabIssuesSettings } from "./SettingsTab/settings-types";
import { DEFAULT_SETTINGS } from "./SettingsTab/settings";
import { logger } from "./utils/utils";

export default class GitlabIssuesPlugin extends Plugin {
	settings: GitlabIssuesSettings;
	startupTimeout: number | null = null;
	automaticRefresh: number | null = null;
	iconAdded = false;

	async onload() {
		logger("Starting plugin");

		await this.loadSettings();
		this.addSettingTab(new GitlabIssuesSettingTab(this.app, this));

		// Enable features only if at least one source has a token configured
		const hasTokenInSources =
			Array.isArray(this.settings.sources) &&
			this.settings.sources.some(
				(s) => s.gitlabToken && s.gitlabToken.length > 0
			);
		if (hasTokenInSources) {
			this.createOutputFolder();
			this.addIconToLeftRibbon();
			this.addCommandToPalette();
			this.refreshIssuesAtStartup();
			this.scheduleAutomaticRefresh();
		}
	}

	scheduleAutomaticRefresh() {
		if (this.automaticRefresh) {
			window.clearInterval(this.automaticRefresh);
		}
		if (this.settings.intervalOfRefresh !== "off") {
			const intervalMinutes = parseInt(this.settings.intervalOfRefresh);

			this.automaticRefresh = this.registerInterval(
				window.setInterval(() => {
					this.fetchFromGitlab();
				}, intervalMinutes * 60 * 1000)
			); // every settings interval in minutes
		}
	}

	onunload() {}

	async loadSettings() {
		// Load raw data so we can migrate any legacy top-level fields into the new `sources` array
		const raw = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);

		if (!this.settings.sources || this.settings.sources.length === 0) {
			// Migrate legacy top-level fields if present in raw
			const legacyToken =
				raw && (raw as any).gitlabToken ? (raw as any).gitlabToken : "";
			const legacyLevel =
				raw && (raw as any).gitlabIssuesLevel
					? (raw as any).gitlabIssuesLevel
					: DEFAULT_SETTINGS.sources![0].gitlabIssuesLevel;
			const legacyAppId =
				raw && (raw as any).gitlabAppId
					? (raw as any).gitlabAppId
					: DEFAULT_SETTINGS.sources![0].gitlabAppId;
			const legacyFilter =
				raw && (raw as any).filter
					? (raw as any).filter
					: DEFAULT_SETTINGS.sources![0].filter;

			this.settings.sources = [
				{
					gitlabUrl: DEFAULT_SETTINGS.sources![0].gitlabUrl,
					gitlabIssuesLevel: legacyLevel as any,
					gitlabAppId: legacyAppId,
					gitlabToken: legacyToken,
					filter: legacyFilter,
				},
			];
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private addIconToLeftRibbon() {
		if (this.settings.showIcon) {
			// Ensure we did not already add an icon
			if (!this.iconAdded) {
				addIcon("gitlab", gitlabIcon);
				this.addRibbonIcon(
					"gitlab",
					"Gitlab Issues",
					(evt: MouseEvent) => {
						this.fetchFromGitlab();
					}
				);
				this.iconAdded = true;
			}
		}
	}

	private addCommandToPalette() {
		this.addCommand({
			id: "import-gitlab-issues",
			name: "Import Gitlab Issues",
			callback: () => {
				this.fetchFromGitlab();
			},
		});
	}

	private refreshIssuesAtStartup() {
		// Clear existing startup timeout
		if (this.startupTimeout) {
			window.clearTimeout(this.startupTimeout);
		}
		if (this.settings.refreshOnStartup) {
			this.startupTimeout = this.registerInterval(
				window.setTimeout(() => {
					this.fetchFromGitlab();
				}, 30 * 1000)
			); // after 30 seconds
		}
	}

	private createOutputFolder() {
		const fs = new Filesystem(app.vault, this.settings);
		fs.createOutputDirectory();
	}

	private fetchFromGitlab() {
		new Notice("Updating issues from Gitlab");
		const loader = new GitlabLoader(this.app, this.settings);
		loader.loadIssues();
	}
}
