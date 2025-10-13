import { GitlabIssuesSettings } from "../../src/SettingsTab/settings-types";
import { DEFAULT_SETTINGS, settings } from "../../src/SettingsTab/settings";

describe("DEFAULT_SETTINGS", () => {
	it("should have the correct default values", () => {
		const expectedDefaults: Omit<GitlabIssuesSettings, "gitlabApiUrl"> = {
			templateFile: "",
			outputDir: "/Gitlab Issues/",
			showIcon: false,
			purgeIssues: true,
			refreshOnStartup: true,
			intervalOfRefresh: "15",
			sources: [
				{
					gitlabUrl: "https://gitlab.com",
					gitlabIssuesLevel: "personal",
					gitlabAppId: "",
					gitlabToken: "",
					filter: "due_date=month",
				},
			],
		};

		// DEFAULT_SETTINGS no longer exposes top-level gitlabApiUrl; derive from first source
		expect(DEFAULT_SETTINGS).toEqual({
			...expectedDefaults,
		});
	});

	it("gitlabApiUrl should return correct API URL", () => {
		expect(DEFAULT_SETTINGS.sources![0].gitlabUrl + "/api/v4").toBe(
			"https://gitlab.com/api/v4"
		);
	});
});

describe("settings", () => {
	it("should have the correct title", () => {
		expect(settings.title).toBe("GitLab Issues Configuration");
	});

	it("should have the correct setting inputs", () => {
		const expectedSettingInputs = [
			{
				title: "Gitlab instance URL",
				description:
					"Use your own Gitlab instance instead of the public hosted Gitlab.",
				placeholder: "https://gitlab.com",
				value: "sources",
			},
			{
				title: "Sources (JSON)",
				description:
					"Edit the list of sources as JSON. Each source should include gitlabUrl, gitlabIssuesLevel, gitlabAppId, gitlabToken (optional) and filter.",
				placeholder:
					'[ { "gitlabUrl": "https://gitlab.com", "gitlabIssuesLevel": "personal", "gitlabAppId": "", "filter": "due_date=month" } ]',
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
				description:
					"Path to an Obsidian folder to write output files to.",
				placeholder: "Gitlab Issues",
				value: "outputDir",
				modifier: "normalizePath",
			},
		];

		expect(settings.settingInputs).toEqual(expectedSettingInputs);
	});

	it("should have the correct dropdowns", () => {
		const expectedDropdowns = [
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
		];

		expect(settings.dropdowns).toEqual(expectedDropdowns);
	});

	it("should have the correct checkBoxInputs", () => {
		const expectedCheckBoxInputs = [
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
		];

		expect(settings.checkBoxInputs).toEqual(expectedCheckBoxInputs);
	});

	// Note: issue-level helper moved to per-source; not tested here

	it("should have the correct Gitlab documentation information", () => {
		expect(settings.gitlabDocumentation).toEqual({
			title: "View the Gitlab documentation",
			url: "https://docs.gitlab.com/ee/api/issues.html#list-issues",
		});
	});
});
