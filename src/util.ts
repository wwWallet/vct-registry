/**
 * Handle a raw VCT string that may or may not be URL-encoded.
 * @param rawVct 
 * @returns decoded VCT string, or undefined if input is invalid
 */
export function decodeVct(rawVct: string): string {

	let decodedVct: string;
	try {
		decodedVct = decodeURIComponent(rawVct);
	} catch (decodingError) {
		console.warn('Error decoding VCT:', decodingError);
		console.warn('Using raw VCT string as-is.');
		decodedVct = rawVct;
	}

	return decodedVct;
}