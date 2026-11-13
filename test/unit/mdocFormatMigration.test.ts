import knex, { Knex } from 'knex';
import { describe, expect, it, vi } from 'vitest';
import { down, up } from '../../src/db/migrations/1793836844_add_mso_mdoc_format';

async function migrationSql(migrate: (db: Knex) => Promise<void>, isMariaDB: boolean) {
	const compiler = knex({ client: 'mysql2' });
	const queries: Knex.Sql[] = [];
	const migrationDb = {
		client: { isMariaDB },
		raw: async (sql: string, bindings: Knex.RawBinding[]) => {
			queries.push(compiler.raw(sql, bindings).toSQL());
		},
	} as unknown as Knex;
	try {
		await migrate(migrationDb);
		return queries;
	} finally {
		await compiler.destroy();
	}
}

describe.each([
	{ engine: 'MySQL', isMariaDB: false, dropCheck: 'drop check' },
	{ engine: 'MariaDB', isMariaDB: true, dropCheck: 'drop constraint' },
])('mdoc format migration on $engine', ({ isMariaDB, dropCheck }) => {
	it('expands the format constraint in a single statement', async () => {
		const queries = await migrationSql(up, isMariaDB);
		expect(queries).toHaveLength(1);
		expect(queries[0].sql).toBe(
			`alter table \`type_metadata\` ${dropCheck} \`type_metadata_format_check\`, add constraint \`type_metadata_format_check\` check (\`format\` in (?, ?))`,
		);
		expect(queries[0].bindings).toEqual(['dc+sd-jwt', 'mso_mdoc']);
	});

	it('restores the SD-JWT-only constraint without modifying stored metadata', async () => {
		const queries = await migrationSql(down, isMariaDB);
		expect(queries).toHaveLength(1);
		expect(queries[0].sql).toBe(
			`alter table \`type_metadata\` ${dropCheck} \`type_metadata_format_check\`, add constraint \`type_metadata_format_check\` check (\`format\` in (?))`,
		);
		expect(queries[0].bindings).toEqual(['dc+sd-jwt']);
	});
});

it('propagates rollback constraint failures without deleting mdoc entries', async () => {
	const error = new Error('Existing mdoc entries violate the SD-JWT-only constraint');
	const raw = vi.fn().mockRejectedValue(error);
	const db = { client: { isMariaDB: true }, raw } as unknown as Knex;
	await expect(down(db)).rejects.toBe(error);
	expect(raw).toHaveBeenCalledTimes(1);
});
