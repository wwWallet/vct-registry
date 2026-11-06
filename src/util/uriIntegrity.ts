import * as crypto from 'crypto';
import type { TypeMetadata } from 'wallet-common';

export type Algorithm = 'sha256' | 'sha384' | 'sha512';

type UriWithIntegrity = {
	uri: string;
	'uri#integrity'?: string;
};

/**
 * Creates an SRI string from a URL that servers an image.
 * @param input - A URL input
 * @param algorithm - Hashing algorithm to use (default: sha256)
 * @returns SRI string like: sha256-<base64Hash>
 */
async function calculateImageSRI(input: string, algorithm: Algorithm = 'sha256'): Promise<string> {
	const buffer = await getImageFromInput(input);

	const hash = crypto.createHash(algorithm).update(buffer).digest('base64');
	return `${algorithm}-${hash}`;
}

async function getImageFromInput(input: string): Promise<Buffer> {
	const response = await fetch(input);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${input}: ${response.status}`);
	}

	const contentType = response.headers.get('content-type') ?? '';
	if (!contentType.startsWith('image/')) {
		throw new Error(`Expected image, got ${contentType}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

function getAllUriValues(vctContent: TypeMetadata): UriWithIntegrity[] {
	const integrityValues: UriWithIntegrity[] = [];

	const addIfUriExists = (object: UriWithIntegrity | undefined) => {
		if (object?.uri) {
			integrityValues.push(object);
		}
	};

	vctContent.display?.forEach((displayEntry) => {
		const rendering = displayEntry.rendering;
		if (!rendering) return;

		if (rendering.simple) {
			addIfUriExists(rendering.simple.logo);
			addIfUriExists(rendering.simple.background_image);
		}

		rendering.svg_templates?.forEach((template) => {
			addIfUriExists(template);
		});
	});

	return integrityValues;
}

/**
 * Returns a cloned metadata document with fresh integrity values for remote image URIs.
 * Data URIs are embedded already and do not need an integrity value.
 */
export async function addVctUriIntegrity(vctContent: TypeMetadata): Promise<TypeMetadata> {
	const metadata = structuredClone(vctContent);
	const uriValues = getAllUriValues(metadata);

	for (const uriValue of uriValues) {
		if (uriValue.uri.startsWith('data:')) continue;

		const existingAlgorithm = uriValue['uri#integrity']?.split('-')[0];
		const algorithm = existingAlgorithm ?? 'sha256';
		if (!['sha256', 'sha384', 'sha512'].includes(algorithm)) {
			throw new Error(`Unsupported algorithm "${algorithm}" for URI "${uriValue.uri}".`);
		}

		uriValue['uri#integrity'] = await calculateImageSRI(uriValue.uri, algorithm as Algorithm);
	}

	return metadata;
}

export async function verifyVctUriIntegrity(
	vctContent: TypeMetadata,
): Promise<{ valid: boolean; message?: string }> {
	let valid: boolean = true;
	const errors: string[] = [];

	const uriValues = getAllUriValues(vctContent);

	for (const uriValue of uriValues) {
		const uri = uriValue.uri;
		const integrity = uriValue['uri#integrity'];

		if (!integrity) {
			continue;
		}

		try {
			const alg = integrity.split('-')[0];
			if (!['sha256', 'sha384', 'sha512'].includes(alg)) {
				errors.push(`Unsupported algorithm "${alg}" in integrity string for URI "${uri}".`);
				valid = false;
				continue;
			}

			const calculatedIntegrity = await calculateImageSRI(uri, alg as Algorithm);
			if (calculatedIntegrity !== integrity) {
				errors.push(`URI integrity mismatch for "${uri}".`);
				valid = false;
			}
		} catch (err) {
			errors.push(`Error verifying URI "${uri}": ${(err as Error).message}`);
			valid = false;
		}
	}

	return {
		valid,
		message: errors.length > 0 ? errors.join(' ') : undefined,
	};
}
