import { describe, expect, it } from "vitest";
import { decodeVct } from "../../src/util";

const expectedResult = "urn:vct:test";

describe("URN encoding/decoding", () => {
	it("Should handle unencoded URNs", () => {
		const result = decodeVct("urn:vct:test");
		expect(result).toBe(expectedResult);
	});

	it("Should handle encoded URNs", () => {
		const result = decodeVct("urn%3Avct%3Atest");
		expect(result).toBe(expectedResult);
	});

	it("Should handle partially encoded URNs", () => {
		const result = decodeVct("urn:vct%3Atest");
		expect(result).toBe(expectedResult);
	});
});
