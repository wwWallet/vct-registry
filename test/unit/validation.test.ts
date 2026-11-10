import { describe, expect, it } from 'vitest';
import { testVCTypeMetadata } from '../typeMetadata/testVct';
import { invalidTestVCTypeMetadata } from '../typeMetadata/invalidVct';
import { TypeMetadata } from 'wallet-common';

const verifiableCredentialTypeMetadata = testVCTypeMetadata;
const invalidVerifiableCredentialTypeMetadata = invalidTestVCTypeMetadata;

describe('ZOD validation', () => {
	it('Should validate correct metadata', () => {
		const zodVctValidationResult = TypeMetadata.safeParse(verifiableCredentialTypeMetadata);
		expect(zodVctValidationResult.success).toBe(true);
	});

	it('Should reject wrong metadata', () => {
		const zodVctValidationResult = TypeMetadata.safeParse(
			invalidVerifiableCredentialTypeMetadata,
		);
		expect(zodVctValidationResult.success).toBe(false);
	});

	it('Should strip additional properties before storage', () => {
		const result = TypeMetadata.safeParse({
			...verifiableCredentialTypeMetadata,
			unexpected: 'remove me',
			display: [
				{
					...verifiableCredentialTypeMetadata.display[0],
					unexpected: 'remove me too',
				},
			],
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).not.toHaveProperty('unexpected');
			expect(result.data.display?.[0]).not.toHaveProperty('unexpected');
		}
	});
});
