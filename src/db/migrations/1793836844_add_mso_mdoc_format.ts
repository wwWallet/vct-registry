import { Knex } from 'knex';

async function setSupportedFormats(knex: Knex, formats: string[]): Promise<void> {
	// Knex detects MariaDB when it initializes the database connection.
	const dropCheck = knex.client.isMariaDB ? 'drop constraint' : 'drop check';
	const placeholders = formats.map(() => '?').join(', ');
	// Replace the constraint in one statement so a failed validation leaves it intact.
	await knex.raw(
		`alter table ?? ${dropCheck} ??, add constraint ?? check (?? in (${placeholders}))`,
		[
			'type_metadata',
			'type_metadata_format_check',
			'type_metadata_format_check',
			'format',
			...formats,
		],
	);
}

export async function up(knex: Knex): Promise<void> {
	await setSupportedFormats(knex, ['dc+sd-jwt', 'mso_mdoc']);
}

export async function down(knex: Knex): Promise<void> {
	// Rollback fails if mdoc entries remain; never delete or relabel their metadata.
	await setSupportedFormats(knex, ['dc+sd-jwt']);
}
