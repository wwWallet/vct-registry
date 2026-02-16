/**
 * Handle a raw VCT string that may or may not be URL-encoded.
 * @param rawVct a vct query/body param that should be a URI string
 * 	but can potentially be undefined, string, Array<string> or Object.
 * @returns a decoded VCT string, undefined if no vct given or null if input is invalid
 */
export function decodeVct(vct: unknown): string | undefined | null {

	if (!vct) {
		return undefined;
	}

	if (typeof vct !== 'string') {
		return null;
	}

	try {
		return decodeURIComponent(vct).trim();
	} catch (decodingError) {
		console.warn(`Error decoding VCT ${vct}: ${decodingError}`);
		return null;
	}

}
