import GitlabApi from "./gitlab-api";
import { GitlabIssue } from "./issue";
import { App } from "obsidian";
import Filesystem from "../filesystem";
import { Issue } from "./issue-types";
import {
	GitlabIssuesSettings,
	GitlabSource,
} from "../SettingsTab/settings-types";
import { DEFAULT_SETTINGS } from "../SettingsTab/settings";
import { logger } from "../utils/utils";

export default class GitlabLoader {
	private fs: Filesystem;
	private settings: GitlabIssuesSettings;

	constructor(app: App, settings: GitlabIssuesSettings) {
		this.fs = new Filesystem(app.vault, settings);
		this.settings = settings ?? DEFAULT_SETTINGS;
	}

	buildUrlForSource(source: GitlabSource): string {
		const base = `${source.gitlabUrl}/api/v4`;
		if (source.gitlabScope?.startsWith("project")) {
			return `${base}/projects/${
				source.gitlabScope.split(":")[1]
			}/issues?${source.filter}`;
		} else if (source.gitlabScope?.startsWith("group")) {
			return `${base}/groups/${source.gitlabScope.split(":")[1]}/issues?${
				source.filter
			}`;
		} else {
			return `${base}/issues?${source.filter}`;
		}
	}

	async loadIssues() {
		const requests = (this.settings.sources ?? []).map(
			async (src: GitlabSource) => {
				let config = { ...(this.settings.default ?? {}), ...src };
				const url = encodeURI(this.buildUrlForSource(config));
				const issues = await GitlabApi.load<Array<Issue>>(
					url,
					(config as any).gitlabToken ?? ""
				);
				return issues.map((i) => new GitlabIssue(i));
			}
		);

		try {
			const results = await Promise.allSettled(requests);
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
				this.fs.purgeRemovedIssues(uniqueIssues);
			}
			this.fs.processIssues(uniqueIssues);
		} catch (error) {
			logger(error.message);
		}
	}
}
