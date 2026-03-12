import { describe, expect, it } from "vitest";
import { testVCTypeMetadata } from "../typeMetadata/testVct";
import { invalidTestVCTypeMetadata } from "../typeMetadata/invalidVct";
import { TypeMetadata } from "wallet-common";

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
