export async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`HTTP ${res.status}: ${text}`);
	}
	return res.json();
}
