export interface SvgTemplate {
	uri: string;
	properties?: {
		orientation?: string;
		color_scheme?: string;
		contrast?: string;
	};
}

export interface TypeMetadata {
	vct: string;
	name?: string;
	description?: string;
	display?: Array<{
		lang?: string;
		name?: string;
		description?: string;
		rendering?: { svg_templates?: SvgTemplate[] };
	}>;
	claims?: unknown[];
	[key: string]: unknown;
}

export interface AuthState {
	loggedIn: boolean;
	username: string;
}
