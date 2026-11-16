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

export type MetadataFormat = 'dc+sd-jwt' | 'mso_mdoc';
export type TypeMetadata = MetadataFields &
	({ vct: string; doctype?: never } | { doctype: string; vct?: never });
export interface MetadataEntry {
	format: MetadataFormat;
	metadata: TypeMetadata;
}

export function metadataId(metadata: TypeMetadata): string {
	return metadata.vct ?? metadata.doctype;
}

export function metadataFormat(metadata: TypeMetadata): MetadataFormat {
	return typeof metadata.vct === 'string' ? 'dc+sd-jwt' : 'mso_mdoc';
}

export function metadataSelector(params: URLSearchParams): string {
	return (
		params.get('identifier') ??
		params.get('id') ??
		params.get('vct') ??
		params.get('doctype') ??
		''
	);
}

export interface AuthState {
	loggedIn: boolean;
	username: string;
}
