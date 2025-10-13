export type GitlabIssuesLevel = "personal" | "project" | "group";
export type GitlabRefreshInterval = "15" | "30" | "45" | "60" | "120" | "off";

export interface GitlabIssuesSettings {
	templateFile: string;
	outputDir: string;
	sources?: Array<{
		gitlabUrl: string;
		gitlabIssuesLevel: GitlabIssuesLevel;
		gitlabAppId: string;
		gitlabToken?: string;
		filter: string;
	}>;
	showIcon: boolean;
	purgeIssues: boolean;
	refreshOnStartup: boolean;
	intervalOfRefresh: GitlabRefreshInterval;
}

export interface SettingOutLink {
	url: string;
	title: string;
}
export interface Setting {
	title: string;
	description: string;
	placeholder?: string;
}
export interface SettingInput extends Setting {
	value: keyof Pick<
		GitlabIssuesSettings,
		"sources" | "outputDir" | "templateFile"
	>;
	modifier?: string;
}
export interface DropdownInputs extends Setting {
	value: keyof Pick<GitlabIssuesSettings, "intervalOfRefresh">;
	options: Record<string, string>;
}
export interface SettingCheckboxInput extends Omit<Setting, "description"> {
	value: keyof Pick<
		GitlabIssuesSettings,
		"refreshOnStartup" | "purgeIssues" | "showIcon"
	>;
}

export interface SettingsTab {
	title: string;
	settingInputs: SettingInput[];
	dropdowns: DropdownInputs[];
	checkBoxInputs: SettingCheckboxInput[];
	gitlabDocumentation: SettingOutLink;
}
