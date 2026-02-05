import { describe, expect, it } from "vitest";
import { testVCTypeMetadata } from "../typeMetadata/testVct";
import { invalidTestVCTypeMetadata } from "../typeMetadata/invalidVct";
import { TypeMetadata } from "../../src/schema/SdJwtVcTypeMetadataSchema";
import { validateAjv } from "../../src/server";

const verifiableCredentialTypeMetadata = testVCTypeMetadata;
const invalidVerifiableCredentialTypeMetadata = invalidTestVCTypeMetadata;

describe("ZOD validation", () => {
	it("Should validate correct metadata", () => {
		const zodVctValidationResult = TypeMetadata.safeParse(
			verifiableCredentialTypeMetadata,
		);
		expect(zodVctValidationResult.success).toBe(true);
	});

	it("Should reject wrong metadata", () => {
		const zodVctValidationResult = TypeMetadata.safeParse(
			invalidVerifiableCredentialTypeMetadata,
		);
		expect(zodVctValidationResult.success).toBe(false);
	});
});

describe("AJV validation", () => {
	it("Should validate correct metadata", () => {
		const ajvValidationResult = validateAjv(
			verifiableCredentialTypeMetadata,
		);
		expect(ajvValidationResult).toBe(true);
	});

	it("Should reject wrong metadata", () => {
		const ajvValidationResult = validateAjv(
			invalidVerifiableCredentialTypeMetadata,
		);
		expect(ajvValidationResult).toBe(false);
	});
});
