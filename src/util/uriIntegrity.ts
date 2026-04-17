import * as crypto from 'crypto';
import { TypeMetadata } from 'wallet-common';
import z from 'zod';

export type Algorithm = 'sha256' | 'sha384' | 'sha512';

type UriWithIntegrity = {
	uri: string;
	integrity?: string;
}

/**
 * Creates an SRI string from a URL that servers an image.
 * @param input - A URL input
 * @param algorithm - Hashing algorithm to use (default: sha256)
 * @returns SRI string like: sha256-<base64Hash>
 */
async function calculateImageSRI(
	input: URL | RequestInfo | string,
	algorithm: Algorithm = 'sha256'
): Promise<string> {

	const buffer = await getImageFromInput(input);

	const hash = crypto.createHash(algorithm).update(buffer).digest('base64');
	return `${algorithm}-${hash}`;
}

async function getImageFromInput(input: URL | RequestInfo | string): Promise<Buffer> {
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

	const addIfUriExists = (object: unknown) => {
		if (object && typeof object === 'object' && object['uri']) {
			integrityValues.push({ uri: object['uri'], integrity: object['uri#integrity'] });
		}
	};

	vctContent.display?.forEach(displayEntry => {
		const rendering = displayEntry.rendering;
		if (!rendering) return;

		if (rendering.simple) {
			addIfUriExists(rendering.simple.logo);
			addIfUriExists(rendering.simple.background_image);
		}

		rendering.svg_templates?.forEach(template => {
			addIfUriExists(template);
		});
	});

	return integrityValues;
}

export async function verifyVctUriIntegrity(vctContent: z.infer<typeof TypeMetadata>): Promise<{ valid: boolean; message?: string }> {

	let valid: boolean = true;
	const errors: string[] = [];

	const uriValues = getAllUriValues(vctContent);

	for (const { uri, integrity } of uriValues) {
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

			const calculatedIntegrity = await calculateImageSRI(uri, alg as Algorithm)
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
		message: errors.length > 0 ? errors.join(" ") : undefined,
	};

}
