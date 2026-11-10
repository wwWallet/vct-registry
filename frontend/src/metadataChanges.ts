function canonicalJson(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalJson);
	if (value !== null && typeof value === 'object') {
		const object = value as Record<string, unknown>;
		return Object.fromEntries(
			Object.keys(object)
				.sort()
				.map((key) => [key, canonicalJson(object[key])]),
		);
	}
	return value;
}

/** Compare content rather than formatting, while protecting incomplete JSON drafts. */
export function hasMetadataChanges(text: string, initialValue: unknown): boolean {
	try {
		return (
			JSON.stringify(canonicalJson(JSON.parse(text))) !==
			JSON.stringify(canonicalJson(initialValue))
		);
	} catch {
		return true;
	}
}
