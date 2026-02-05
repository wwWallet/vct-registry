import { Knex } from "knex";
import { initialDbContent } from "../data";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries to prevent duplicates during testing
    await knex("vct").del();

    // Inserts seed entries
    for (const vct of initialDbContent) {
        await knex("vct").insert({
            urn: vct.urn,
            metadata: vct.metadata,
        });
    }
};