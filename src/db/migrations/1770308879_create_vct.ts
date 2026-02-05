import { Knex } from "knex";
import { initialDbContent } from "../data";

export async function up(knex: Knex): Promise<void> {
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

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists("vct");
}
