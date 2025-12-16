import { App } from "obsidian";
import * as Filesystem from "../../src/filesystem";
import { GitlabIssuesSettings } from "../../src/SettingsTab/settings-types";
import GitlabLoader from "../../src/GitlabLoader/gitlab-loader";
import GitlabApi from "../../src/GitlabLoader/gitlab-api";
import { Issue } from "../../src/GitlabLoader/issue-types";
import { GitlabIssue } from "../../src/GitlabLoader/issue";

const mockPurgeRemovedIssues = jest.fn();
const mockProcessIssues = jest.fn();
const mockFileSystem = jest.spyOn(Filesystem, "default").mockReturnValue({
	purgeRemovedIssues: mockPurgeRemovedIssues,
	processIssues: mockProcessIssues,
} as any);

const mockLoad = jest.spyOn(GitlabApi, "load");

const mockSettings: GitlabIssuesSettings = {
	templateFile: "template.md",
	outputDir: "/Gitlab Issues/",
	default: {
		gitlabUrl: "https://gitlab.com",
		gitlabToken: "test-token",
	},
	sources: [
		{
			gitlabScope: "project:12345",
			filter: "due_date=month",
		},
	],
	showIcon: false,
	purgeIssues: true,
	refreshOnStartup: true,
	intervalOfRefresh: "15",
};

const mockApp = {} as App;

describe("GitlabLoader", () => {
	let gitlabLoader: GitlabLoader;

	beforeEach(() => {
		gitlabLoader = new GitlabLoader(mockApp, mockSettings);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should initialize with correct properties", () => {
		expect(gitlabLoader["settings"]).toEqual(mockSettings);
	});

	it("should construct correct URL for project level", () => {
		expect(gitlabLoader.buildUrlForSource(mockSettings.sources![0])).toBe(
			"https://gitlab.com/api/v4/projects/12345/issues?due_date=month"
		);
	});

	it("should construct correct URL for group level", () => {
		mockSettings.sources![0].gitlabScope = "group:12345";
		expect(gitlabLoader.buildUrlForSource(mockSettings.sources![0])).toBe(
			"https://gitlab.com/api/v4/groups/12345/issues?due_date=month"
		);
	});

	it("should construct correct URL for personal level", () => {
		mockSettings.sources![0].gitlabScope = "personal";
		expect(gitlabLoader.buildUrlForSource(mockSettings.sources![0])).toBe(
			"https://gitlab.com/api/v4/issues?due_date=month"
		);
	});

	it("should load issues and process them", async () => {
		const mockIssues = [
			{
				id: 1,
				title: "Issue 1",
				description: "",
				due_date: "",
				web_url: "",
				references: "",
			},
			{
				id: 2,
				title: "Issue 2",
				description: "",
				due_date: "",
				web_url: "",
				references: "",
			},
		] as Issue[];

		mockLoad.mockResolvedValue(mockIssues);

		await gitlabLoader.loadIssues();

		expect(mockPurgeRemovedIssues).toHaveBeenCalled();
		expect(mockProcessIssues).toHaveBeenCalledWith(
			expect.arrayContaining([expect.any(GitlabIssue)])
		);
	});
});
