export async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}

/**
 * Handle a raw VCT string that may or may not be URL-encoded.
 * @param rawVct
 * @returns decoded VCT string, or undefined if input is invalid
 */
export function decodeVct(rawVct) {
	let decodedVct;
	try {
		decodedVct = decodeURIComponent(rawVct);
	} catch (decodingError) {
		console.warn("Error decoding VCT:", decodingError);
		console.warn("Using raw VCT string as-is.");
		decodedVct = rawVct;
	}

	return decodedVct;
}

export async function login() {
	try {
        await fetch('/login', { credentials: 'include' });
    } catch (_err) { }
}

export async function logout() {
	try {
		await fetch('/logout', { credentials: 'include' });
	} catch (err) { }
}