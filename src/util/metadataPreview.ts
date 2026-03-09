import { CredentialRenderingService, CustomCredentialSvg, dataUriResolver, defaultHttpClient } from "wallet-common";

const customRenderer = CustomCredentialSvg({ httpClient: defaultHttpClient });
const sdJwtVcRenderer = CredentialRenderingService();

export async function getMetadataPreviewDataUri(metadata: any): Promise<string | null> {
	if (!metadata || !Array.isArray(metadata.display) || metadata.display.length === 0) {
		return null;
	}

	const resolve = dataUriResolver({
		httpClient: defaultHttpClient,
		sdJwtVcRenderer,
		customRenderer,
		credentialDisplayArray: metadata.display,
		fallbackName: metadata.name || "Credential",
	});

	return resolve(undefined, ["en-US"]);
}
