import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('vct', (table) => {
		table.string('format').nullable();
		table.check("`format` in ('dc+sd-jwt')", [], 'type_metadata_format_check');
	});
	// Backfill legacy entries once; future inserts must provide a format.
	await knex('vct').whereNull('format').update({ format: 'dc+sd-jwt' });
	await knex.schema.alterTable('vct', (table) => {
		table.string('format').notNullable().alter();
	});
	await knex.schema.renameTable('vct', 'type_metadata');
	await knex.schema.alterTable('type_metadata', (table) => {
		table.renameColumn('urn', 'identifier');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('type_metadata', (table) => {
		table.renameColumn('identifier', 'urn');
	});
	await knex.schema.renameTable('type_metadata', 'vct');
	await knex.schema.alterTable('vct', (table) => {
		table.dropColumn('format');
	});
}
