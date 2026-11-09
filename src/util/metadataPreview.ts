import {
	CredentialRenderingService,
	CustomCredentialSvg,
	dataUriResolver,
	defaultHttpClient,
} from 'wallet-common';
import type { SvgTemplateEntry, SvgTemplateProperties } from 'wallet-common';
import type { RegistryMetadata } from '../schemas/metadata';

const customRenderer = CustomCredentialSvg({ httpClient: defaultHttpClient });
const sdJwtVcRenderer = CredentialRenderingService();

const DEFAULT_LANGS = ['en-US'];

export type MetadataPreviewOptions = {
	preferredLangs?: string[];
	preferredProperties?: SvgTemplateProperties;
};

function createMetadataPreviewResolver(metadata: RegistryMetadata) {
	return dataUriResolver({
		httpClient: defaultHttpClient,
		sdJwtVcRenderer,
		customRenderer,
		credentialDisplayArray: metadata.display,
	});
}

export async function getMetadataPreviewDataUri(
	metadata: RegistryMetadata,
	options: MetadataPreviewOptions = {},
): Promise<string | null> {
	const resolve = createMetadataPreviewResolver(metadata);

	return resolve(undefined, options.preferredLangs ?? DEFAULT_LANGS, options.preferredProperties);
}

export function getMetadataPreviewSvgUris(metadata: RegistryMetadata): SvgTemplateEntry[] {
	return metadata.display?.flatMap((display) => display.rendering?.svg_templates ?? []) ?? [];
}
