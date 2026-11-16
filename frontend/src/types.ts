export interface SvgTemplate {
	uri: string;
	properties?: {
		orientation?: string;
		color_scheme?: string;
		contrast?: string;
	};
}

interface MetadataFields {
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

export type MetadataFormat = 'dc+sd-jwt';
export type TypeMetadata = MetadataFields & { vct: string };
export interface MetadataEntry {
	format: MetadataFormat;
	metadata: TypeMetadata;
}

export function metadataId(metadata: TypeMetadata): string {
	return metadata.vct;
}

export function metadataFormat(_metadata: TypeMetadata): MetadataFormat {
	void _metadata;
	return 'dc+sd-jwt';
}

export function metadataSelector(params: URLSearchParams): string {
	return params.get('identifier') ?? params.get('id') ?? params.get('vct') ?? '';
}

export interface AuthState {
	loggedIn: boolean;
	username: string;
}
