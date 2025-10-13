import { GitlabIssuesSettings, SettingsTab } from "./settings-types";

export const DEFAULT_SETTINGS: GitlabIssuesSettings = {
	templateFile: "",
	outputDir: "/Gitlab Issues/",
	sources: [
		{
			gitlabUrl: "https://gitlab.com",
			gitlabIssuesLevel: "personal",
			gitlabAppId: "",
			gitlabToken: "",
			filter: "due_date=month",
		},
	],
	showIcon: false,
	purgeIssues: true,
	refreshOnStartup: true,
	intervalOfRefresh: "15",
};

export const settings: SettingsTab = {
	title: "GitLab Issues Configuration",
	settingInputs: [
		{
			title: "Gitlab instance URL",
			description:
				"Use your own Gitlab instance instead of the public hosted Gitlab.",
			placeholder: "https://gitlab.com",
			value: "sources",
		},
		{
			title: "Template File",
			description: "Path to an Obsidian note to use as the template.",
			placeholder: "your-template-file.md",
			value: "templateFile",
		},
		{
			title: "Output Folder",
			description: "Path to an Obsidian folder to write output files to.",
			placeholder: "Gitlab Issues",
			value: "outputDir",
			modifier: "normalizePath",
		},
		// Note: filter is now per-source; edit sources in the settings UI (not yet implemented)
	],
	dropdowns: [
		{
			title: "Refresh Rate",
			description: "That rate at which gitlab issues will be pulled.",
			options: {
				off: "off",
				"15": "15",
				"30": "30",
				"45": "45",
				"60": "60",
				"120": "120",
			},
			value: "intervalOfRefresh",
		},
		// Note: gitlab scope (issuesLevel) is now part of each source; not exposed here
	],
	checkBoxInputs: [
		{
			title: "Purge issues that are no longer in Gitlab?",
			value: "purgeIssues",
		},
		{
			title: "Show refresh Gitlab issues icon in left ribbon?",
			value: "showIcon",
		},
		{
			title: "Should refresh Gitlab issues on Startup?",
			value: "refreshOnStartup",
		},
	],
	gitlabDocumentation: {
		title: "View the Gitlab documentation",
		url: "https://docs.gitlab.com/ee/api/issues.html#list-issues",
	},
};
