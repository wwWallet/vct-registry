/**
 * Handle a raw identifier string that may or may not be URL-encoded.
 * @param identifier an id, identifier, vct, or doctype query/body parameter
 * 	but can potentially be undefined, string, Array<string> or Object.
 * @returns a decoded identifier string, undefined if no identifier given or null if input is invalid
 */
export function decodeIdentifier(identifier: unknown): string | undefined | null {
	if (!identifier) {
		return undefined;
	}

	if (typeof identifier !== 'string') {
		return null;
	}

	try {
		return decodeURIComponent(identifier).trim();
	} catch (decodingError) {
		console.warn(`Error decoding identifier ${identifier}: ${decodingError}`);
		return null;
	}
}

/** Validate a transport-decoded identifier without changing its value. */
export function parseIdentifier(identifier: unknown): string | undefined | null {
	if (identifier === undefined || identifier === null || identifier === '') return undefined;
	if (typeof identifier !== 'string' || identifier.trim().length === 0) return null;
	return identifier;
}

export function reverseList<T>(items: T[]): T[] {
	return items.slice().reverse();
}
