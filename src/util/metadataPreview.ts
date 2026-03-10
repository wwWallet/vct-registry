import { CredentialRenderingService, CustomCredentialSvg, dataUriResolver, defaultHttpClient } from "wallet-common";

const customRenderer = CustomCredentialSvg({ httpClient: defaultHttpClient });
const sdJwtVcRenderer = CredentialRenderingService();

export async function getMetadataPreviewDataUri(metadata: any): Promise<string | null> {

	const resolve = dataUriResolver({
		httpClient: defaultHttpClient,
		sdJwtVcRenderer,
		customRenderer,
		credentialDisplayArray: metadata.display,
	});

	return resolve(undefined, ["en-US"]);
}
