import { Knex } from "knex";
import { TypeMetadata } from "../schema/SdJwtVcTypeMetadataSchema";

export async function initVctTable(knex: Knex) {
	try {
		await knex.migrate.latest();
	} catch (error) {
		console.error("Error initializing VCT table: ", error);
	}
}

/**
 * Insert a new vct entry.
 * @returns number of inserted rows, or -1 on error
 */
export async function createVct(
	knex: Knex,
	vctUrn: string,
	vctMetadata: object,
): Promise<number> {
	try {
		const result = await knex("vct").insert({
			urn: vctUrn,
			metadata: vctMetadata,
		});
		return result.length; // number of inserted rows (should be 1)
	} catch (error) {
		console.error("Error creating VCT: ", error);
		return -1;
	}
}

export async function getVctByUrn(
	knex: Knex,
	vctUrn: string,
): Promise<TypeMetadata | undefined> {
	try {
		const result = await knex("vct")
			.where("urn", vctUrn)
			.select("metadata")
			.first();
		return result ? (JSON.parse(result.metadata) as TypeMetadata) : result;
	} catch (error) {
		console.error("Error fetching VCT: ", error);
		return undefined;
	}
}

/**
 * Should update exactly one vct entry.
 * @returns an array of IDs of updated rows
 */
export async function updateVctByUrn(
	knex: Knex,
	vctUrn: string,
	vctMetadata: object,
): Promise<number> {
	try {
		const result: number = await knex("vct")
			.where("urn", vctUrn)
			.update({
				metadata: JSON.stringify(vctMetadata),
			});

		if (result === 0) {
			console.warn(`No VCT found with urn "${vctUrn}" to update.`);
		} else if (result > 1) {
			console.warn(
				`Multiple VCTs updated with urn "${vctUrn}". This should not happen if "urn" is unique.`,
			);
		}

		return result;
	} catch (error) {
		console.error("Error updating VCT: ", error);
		return -1;
	}
}

/**
 * Should delete exactly one vct entry.
 * @returns the number of deleted rows, or -1 if an error occurred
 */
export async function deleteVctByUrn(
	knex: Knex,
	vctUrn: string,
): Promise<number> {
	try {
		const result = await knex("vct").where("urn", vctUrn).del();

		if (result === 0) {
			console.warn(`No VCT found with urn "${vctUrn}" to delete.`);
		} else if (result > 1) {
			console.warn(
				`Multiple VCTs deleted with urn "${vctUrn}". This should not happen if "urn" is unique.`,
			);
		}

		return result;
	} catch (error) {
		console.error("Error deleting VCT: ", error);
		return -1;
	}
}

export async function getAllVctMetadata(knex: Knex): Promise<TypeMetadata[]> {
	try {
		const result: Array<{ metadata: string }> =
			await knex("vct").select("metadata");
		return result.map((row) => JSON.parse(row.metadata) as TypeMetadata);
	} catch (error) {
		console.error("Error fetching VCTs:", error);
		return [];
	}
}