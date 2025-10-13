import GitlabApi from "./gitlab-api";
import { GitlabIssue } from "./issue";
import { App } from "obsidian";
import Filesystem from "../filesystem";
import { Issue } from "./issue-types";
import { GitlabIssuesSettings } from "../SettingsTab/settings-types";
import { DEFAULT_SETTINGS } from "../SettingsTab/settings";
import { logger } from "../utils/utils";

export default class GitlabLoader {
	private fs: Filesystem;
	private settings: GitlabIssuesSettings;

	constructor(app: App, settings: GitlabIssuesSettings) {
		this.fs = new Filesystem(app.vault, settings);
		this.settings = settings;
	}

	private buildUrlForSource(source: {
		gitlabUrl: string;
		gitlabIssuesLevel: any;
		gitlabAppId: string;
		filter: string;
	}) {
		const base = `${source.gitlabUrl}/api/v4`;
		switch (source.gitlabIssuesLevel) {
			case "project":
				return `${base}/projects/${source.gitlabAppId}/issues?${source.filter}`;
			case "group":
				return `${base}/groups/${source.gitlabAppId}/issues?${source.filter}`;
			case "personal":
			default:
				return `${base}/issues?${source.filter}`;
		}
	}

	// Backwards-compatible helper used by tests: returns URL for the primary source
	getUrl() {
		const src =
			this.settings.sources && this.settings.sources.length > 0
				? this.settings.sources[0]
				: {
						gitlabUrl: DEFAULT_SETTINGS.sources![0].gitlabUrl,
						gitlabIssuesLevel: "personal" as any,
						gitlabAppId: "",
						filter: "",
				  };
		return this.buildUrlForSource(src);
	}

	loadIssues() {
		const sources =
			this.settings.sources && this.settings.sources.length > 0
				? this.settings.sources
				: [
						{
							gitlabUrl: DEFAULT_SETTINGS.sources![0].gitlabUrl,
							gitlabIssuesLevel: "personal" as any,
							gitlabAppId: "",
							filter: "",
						},
				  ];

		const requests = sources.map((src) => {
			const url = encodeURI(this.buildUrlForSource(src));
			return GitlabApi.load<Array<Issue>>(
				url,
				(src as any).gitlabToken ?? ""
			).then((issues: Array<Issue>) =>
				issues.map((i) => new GitlabIssue(i))
			);
		});

		return Promise.allSettled(requests)
			.then((results) => {
				const allIssues: GitlabIssue[] = [];
				results.forEach((res, idx) => {
					if (res.status === "fulfilled") {
						allIssues.push(...(res.value as GitlabIssue[]));
					} else {
						logger(
							`Error loading issues for source ${idx}: ${res.reason}`
						);
					}
				});

				// deduplicate by issue.id
				const uniqueMap = new Map<number, GitlabIssue>();
				allIssues.forEach((issue) => {
					if (!uniqueMap.has(issue.id)) {
						uniqueMap.set(issue.id, issue);
					}
				});

				const uniqueIssues = Array.from(uniqueMap.values());

				if (this.settings.purgeIssues) {
					this.fs.purgeExistingIssues();
				}
				this.fs.processIssues(uniqueIssues);
			})
			.catch((error) => {
				logger(error.message);
			});
	}
}
