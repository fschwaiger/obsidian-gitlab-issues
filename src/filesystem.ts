import { Vault, TFile, TAbstractFile, TFolder } from "obsidian";
import { compile } from "handlebars";
import { ObsidianIssue } from "./GitlabLoader/issue-types";
import { GitlabIssuesSettings } from "./SettingsTab/settings-types";
import { DEFAULT_TEMPLATE, logger } from "./utils/utils";

export default class Filesystem {
	private vault: Vault;

	private settings: GitlabIssuesSettings;

	constructor(vault: Vault, settings: GitlabIssuesSettings) {
		this.vault = vault;
		this.settings = settings;
	}

	public createOutputDirectory() {
		this.vault.createFolder(this.settings.outputDir).catch((error) => {
			if (error.message !== "Folder already exists.") {
				logger("Could not create output directory");
			}
		});
	}

	public purgeRemovedIssues(issues: Array<ObsidianIssue>) {
		const outputDir: TAbstractFile | null =
			this.vault.getAbstractFileByPath(this.settings.outputDir);

		if (outputDir instanceof TFolder) {
			Vault.recurseChildren(outputDir, (existingFile: TAbstractFile) => {
				if (existingFile instanceof TFile) {
					if (
						!issues.find(
							(issue) =>
								this.buildFileName(issue) === existingFile.path
						)
					) {
						this.vault
							.delete(existingFile)
							.catch((error) => logger(error.message));
					}
				}
			});
		}
	}

	public processIssues(issues: Array<ObsidianIssue>) {
		this.vault.adapter
			.read(this.settings.templateFile)
			.then((rawTemplate: string) => {
				issues.map((issue: ObsidianIssue) =>
					this.writeFile(issue, compile(rawTemplate))
				);
			})
			.catch((error) => {
				issues.map((issue: ObsidianIssue) =>
					this.writeFile(issue, compile(DEFAULT_TEMPLATE.toString()))
				);
			});
	}

	private writeFile(
		issue: ObsidianIssue,
		template: HandlebarsTemplateDelegate
	) {
		const name = this.buildFileName(issue);
		const file = this.vault.getAbstractFileByPath(name);
		(file !== null && file instanceof TFile
			? this.vault.modify(file as TFile, template(issue))
			: this.vault.create(name, template(issue))
		).catch((error) => logger(error.message));
	}

	private buildFileName(issue: ObsidianIssue): string {
		return this.settings.outputDir + "/" + issue.filename + ".md";
	}
}
