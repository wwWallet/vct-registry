import type { TypeMetadata } from './types';

const algorithmNames = {
	sha256: 'SHA-256',
	sha384: 'SHA-384',
	sha512: 'SHA-512',
} as const;

type Algorithm = keyof typeof algorithmNames;

function isAlgorithm(value: string): value is Algorithm {
	return Object.hasOwn(algorithmNames, value);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

async function calculateUriIntegrity(uri: string, algorithm: Algorithm): Promise<string> {
	let response: Response;
	try {
		response = await fetch(uri);
	} catch (error) {
		throw new Error(`Error fetching URL '${uri}': ${(error as Error).message}`);
	}

	if (!response.ok) {
		throw new Error(`Error fetching URL '${uri}': ${response.statusText}`);
	}

	const hash = await crypto.subtle.digest(
		algorithmNames[algorithm],
		await response.arrayBuffer(),
	);
	const base64Hash = btoa(String.fromCharCode(...new Uint8Array(hash)));
	return `${algorithm}-${base64Hash}`;
}

async function addIntegrityValues(value: unknown): Promise<void> {
	if (Array.isArray(value)) {
		for (const item of value) await addIntegrityValues(item);
		return;
	}
	if (!isObject(value)) return;

	const uri = value.uri;
	if (typeof uri === 'string' && !(uri.startsWith('data:') && uri.includes(';base64,'))) {
		const existingIntegrity = value['uri#integrity'];
		const algorithm =
			typeof existingIntegrity === 'string' ? existingIntegrity.split('-')[0] : 'sha256';
		if (!isAlgorithm(algorithm)) {
			throw new Error(`Unsupported algorithm "${algorithm}" for URI "${uri}".`);
		}
		value['uri#integrity'] = await calculateUriIntegrity(uri, algorithm);
	}

	for (const child of Object.values(value)) await addIntegrityValues(child);
}

export async function addMetadataUriIntegrity(metadata: TypeMetadata): Promise<TypeMetadata> {
	const result = structuredClone(metadata);
	await addIntegrityValues(result);
	return result;
}
