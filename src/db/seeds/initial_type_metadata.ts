import { Knex } from 'knex';
import { initialDbContent } from '../data';

export async function seed(knex: Knex): Promise<void> {
	// Deletes ALL existing entries to prevent duplicates during testing
	await knex('type_metadata').del();

	// Inserts seed entries
	for (const entry of initialDbContent) {
		await knex('type_metadata').insert({
			identifier: entry.urn,
			metadata: entry.metadata,
			format: 'dc+sd-jwt',
		});
	}
}
