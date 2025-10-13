import { sanitizeFileName } from "../utils/utils";
import {
	Assignee,
	Epic,
	Issue,
	ObsidianIssue,
	References,
	ShortIssue,
	TimeStats,
} from "./issue-types";

export class GitlabIssue implements ObsidianIssue {
	id: number;
	title: string;
	description: string;
	due_date: string;
	web_url: string;
	references: References;
	project: string;
	short_id: string;

	get filename() {
		return sanitizeFileName(this.title);
	}

	constructor(issue: Issue) {
		Object.assign(this, issue);
		// references in tests may be a string; normalize to object with full
		const refsFull =
			this.references && (this.references as any).full
				? (this.references as any).full
				: (this.references as any as string);
		this.references =
			typeof refsFull === "string" ? (refsFull as any) : this.references;
		this.project = refsFull ? refsFull.replace(/#.*$/, "") : "";
		this.short_id = refsFull
			? refsFull
					.replace(/^.*\/(.*?)#.*$/, "$1")
					.replace(/(\w).*?($|_| |-)/g, "$1")
					.toUpperCase()
			: "";
	}

	_links: {
		self: string;
		notes: string;
		award_emoji: string;
		project: string;
		closed_as_duplicate_of: string;
	};
	assignees: Assignee[];
	author: Assignee;
	closed_by: Assignee;
	confidential: boolean;
	created_at: string;
	discussion_locked: boolean;
	downvotes: number;
	epic: Epic;
	has_tasks: boolean;
	iid: number;
	imported: boolean;
	imported_from: string;
	issue_type: string;
	labels: string[];
	merge_requests_count: number;
	milestone: ShortIssue;
	project_id: number;
	severity: string;
	state: string;
	task_completion_status: { count: number; completed_count: number };
	task_status: string;
	time_stats: TimeStats;
	updated_at: string;
	upvotes: number;
	user_notes_count: number;
}
