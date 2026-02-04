import { Knex } from "knex";
import { randomUUID, UUID } from "crypto";
import { diplomaMetadata } from "../typeMetadata/diploma";
import { ehicMetadata } from "../typeMetadata/ehic";
import { pda1Metadata } from "../typeMetadata/pda1";
import { pidMetadata } from "../typeMetadata/pid";
import { porMetadata } from "../typeMetadata/por";
import { TypeMetadata } from "../schema/SdJwtVcTypeMetadataSchema";

const initialDbContent = [
	{
		urn: diplomaMetadata.vct,
		metadata: diplomaMetadata,
	},
	{
		urn: ehicMetadata.vct,
		metadata: ehicMetadata,
	},
	{
		urn: pda1Metadata.vct,
		metadata: pda1Metadata,
	},
	{
		urn: pidMetadata.vct,
		metadata: pidMetadata,
	},
	{
		urn: porMetadata.vct,
		metadata: porMetadata,
	},
];

export async function initVctTable(knex: Knex) {
	try {
		const exists = await knex.schema.hasTable("vct");

		if (!exists) {
			//TODO vmarkop refactor to urn (primary) and metadata (json)
			await knex.schema.createTable("vct", (table) => {
				table.string("urn").primary();
				table.json("metadata").notNullable();
			});

			for (const vct of initialDbContent) {
				await knex("vct").insert({
					urn: vct.urn,
					metadata: vct.metadata,
				});
			}
		}
	} catch (error) {
		console.error("Error initializing VCT table: ", error);
	}
}

/**
 * Insert a new vct entry.
 * @returns an array of IDs of updated rows
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
		})[0];

		if (!result) {
			console.warn(`VCT was not created.`);
		}

		return result;
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