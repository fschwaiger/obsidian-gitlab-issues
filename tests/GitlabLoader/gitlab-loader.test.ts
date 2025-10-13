import { App } from "obsidian";
import * as Filesystem from "../../src/filesystem";
import { GitlabIssuesSettings } from "../../src/SettingsTab/settings-types";
import GitlabLoader from "../../src/GitlabLoader/gitlab-loader";
import GitlabApi from "../../src/GitlabLoader/gitlab-api";
import { Issue } from "../../src/GitlabLoader/issue-types";
import { GitlabIssue } from "../../src/GitlabLoader/issue";

const mockPurgeExistingIssues = jest.fn();
const mockProcessIssues = jest.fn();
const mockFileSystem = jest.spyOn(Filesystem, "default").mockReturnValue({
	purgeExistingIssues: mockPurgeExistingIssues,
	processIssues: mockProcessIssues,
} as any);

const mockLoad = jest.spyOn(GitlabApi, "load");

const mockSettings: GitlabIssuesSettings = {
	templateFile: "template.md",
	outputDir: "/Gitlab Issues/",
	sources: [
		{
			gitlabUrl: "https://gitlab.com",
			gitlabIssuesLevel: "project",
			gitlabAppId: "12345",
			gitlabToken: "test-token",
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
		const expectedUrl = `${
			mockSettings.sources![0].gitlabUrl
		}/api/v4/projects/${mockSettings.sources![0].gitlabAppId}/issues?${
			mockSettings.sources![0].filter
		}`;
		expect(gitlabLoader.getUrl()).toBe(expectedUrl);
	});

	it("should construct correct URL for group level", () => {
		mockSettings.sources![0].gitlabIssuesLevel = "group";
		const expectedUrl = `${
			mockSettings.sources![0].gitlabUrl
		}/api/v4/groups/${mockSettings.sources![0].gitlabAppId}/issues?${
			mockSettings.sources![0].filter
		}`;
		expect(gitlabLoader.getUrl()).toBe(expectedUrl);
	});

	it("should construct correct URL for personal level", () => {
		mockSettings.sources![0].gitlabIssuesLevel = "personal";
		const expectedUrl = `${
			mockSettings.sources![0].gitlabUrl
		}/api/v4/issues?${mockSettings.sources![0].filter}`;
		expect(gitlabLoader.getUrl()).toBe(expectedUrl);
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

		expect(GitlabApi.load).toHaveBeenCalledWith(
			encodeURI(gitlabLoader.getUrl()),
			mockSettings.sources![0].gitlabToken
		);
		expect(mockPurgeExistingIssues).toHaveBeenCalled();
		expect(mockProcessIssues).toHaveBeenCalledWith(
			expect.arrayContaining([expect.any(GitlabIssue)])
		);
	});
});
