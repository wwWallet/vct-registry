// src/sriGenerator.ts
import * as fs from 'fs';
import * as crypto from 'crypto';
import path from 'path';

export type Algorithm = 'sha256' | 'sha384' | 'sha512';

/**
 * Creates an SRI string from either an object or a file path.
 * @param input - A JS object or a file path string
 * @param algorithm - Hashing algorithm to use (default: sha256)
 * @returns SRI string like: sha256-<base64Hash>
 */
export function createSRI(
	input: Record<string, any> | string,
	algorithm: Algorithm = 'sha256'
): string {
	let buffer: Buffer;
	
	if (typeof input === 'string') {
		const fullPath = path.join(__dirname, "../public/images/", input);
		// Treat as file path
		if (!fs.existsSync(fullPath)) {
			throw new Error(`File not found: ${fullPath}`);
		}
		buffer = fs.readFileSync(fullPath);
	} else if (typeof input === 'object' && input !== null) {
		// Treat as object
		const jsonString = JSON.stringify(input);
		buffer = Buffer.from(jsonString, 'utf-8');
	} else {
		throw new Error('Unsupported input type for createSRI');
	}

	const hash = crypto.createHash(algorithm).update(buffer).digest('base64');
	return `${algorithm}-${hash}`;
}
