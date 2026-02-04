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
		name: diplomaMetadata.vct,
		content: diplomaMetadata,
	},
	{
		name: ehicMetadata.vct,
		content: ehicMetadata,
	},
	{
		name: pda1Metadata.vct,
		content: pda1Metadata,
	},
	{
		name: pidMetadata.vct,
		content: pidMetadata,
	},
	{
		name: porMetadata.vct,
		content: porMetadata,
	},
];

export async function initVctTable(knex: Knex) {
	try {
		const exists = await knex.schema.hasTable("vct");

		if (!exists) {
			//TODO vmarkop refactor to urn (primary) and metadata (json)
			await knex.schema.createTable("vct", (table) => {
				table.uuid("id").primary();
				table.string("name").notNullable().unique();
				table.json("content").notNullable();
			});

			for (const vct of initialDbContent) {
				await knex("vct").insert({
					id: randomUUID(),
					name: vct.name,
					content: vct.content,
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
	vctName: string,
	vctContent: object,
	vctId?: UUID,
): Promise<number> {
	try {
		const result = await knex("vct").insert({
			id: vctId || randomUUID(),
			name: vctName,
			content: vctContent,
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

export async function getVctByName(
	knex: Knex,
	vctName: string,
): Promise<TypeMetadata | undefined> {
	try {
		const result = await knex("vct")
			.where("name", vctName)
			.select("content")
			.first();
		return result ? (JSON.parse(result.content) as TypeMetadata) : result;
	} catch (error) {
		console.error("Error fetching VCT: ", error);
		return undefined;
	}
}

/**
 * Should update exactly one vct entry.
 * @returns an array of IDs of updated rows
 */
export async function updateVctByName(
	knex: Knex,
	vctName: string,
	vctContent: object,
): Promise<number> {
	try {
		const result: number = await knex("vct")
			.where("name", vctName)
			.update({
				content: JSON.stringify(vctContent),
			});

		if (result === 0) {
			console.warn(`No VCT found with name "${vctName}" to update.`);
		} else if (result > 1) {
			console.warn(
				`Multiple VCTs updated with name "${vctName}". This should not happen if "name" is unique.`,
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
export async function deleteVctByName(
	knex: Knex,
	vctName: string,
): Promise<number> {
	try {
		const result = await knex("vct").where("name", vctName).del();

		if (result === 0) {
			console.warn(`No VCT found with name "${vctName}" to delete.`);
		} else if (result > 1) {
			console.warn(
				`Multiple VCTs deleted with name "${vctName}". This should not happen if "name" is unique.`,
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
		const result: Array<{ content: string }> =
			await knex("vct").select("content");
		return result.map((row) => JSON.parse(row.content) as TypeMetadata);
	} catch (error) {
		console.error("Error fetching VCTs:", error);
		return [];
	}
}