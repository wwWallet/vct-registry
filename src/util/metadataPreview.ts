import { CredentialRenderingService, CustomCredentialSvg, dataUriResolver, defaultHttpClient } from "wallet-common";
import type { TypeMetadata } from "wallet-common";

const customRenderer = CustomCredentialSvg({ httpClient: defaultHttpClient });
const sdJwtVcRenderer = CredentialRenderingService();

const DEFAULT_LANGS = ["en-US"];

type PreviewTemplateProperties = {
	orientation?: "portrait" | "landscape";
	color_scheme?: "light" | "dark";
	contrast?: "normal" | "high";
};

export type MetadataPreviewOptions = {
	preferredLangs?: string[];
	preferredProperties?: PreviewTemplateProperties;
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
