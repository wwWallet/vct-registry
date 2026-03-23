import { CredentialRenderingService, CustomCredentialSvg, dataUriResolver, defaultHttpClient } from "wallet-common";
import type { SvgTemplateEntry, SvgTemplateProperties, TypeMetadata } from "wallet-common";

const customRenderer = CustomCredentialSvg({ httpClient: defaultHttpClient });
const sdJwtVcRenderer = CredentialRenderingService();

const DEFAULT_LANGS = ["en-US"];

export type MetadataPreviewOptions = {
	preferredLangs?: string[];
	preferredProperties?: SvgTemplateProperties;
};

function createMetadataPreviewResolver(metadata: TypeMetadata) {
	return dataUriResolver({
		httpClient: defaultHttpClient,
		sdJwtVcRenderer,
		customRenderer,
		credentialDisplayArray: metadata.display,
	});
}

export async function getMetadataPreviewDataUri(
	metadata: TypeMetadata,
	options: MetadataPreviewOptions = {},
): Promise<string | null> {
	const resolve = createMetadataPreviewResolver(metadata);

	return resolve(
		undefined,
		options.preferredLangs ?? DEFAULT_LANGS,
		options.preferredProperties,
	);
}

export function getMetadataPreviewSvgUris(metadata: TypeMetadata): SvgTemplateEntry[] {
	return (
		metadata.display?.flatMap((display) =>
			display.rendering?.svg_templates ?? [],
		) ?? []
	);
}
