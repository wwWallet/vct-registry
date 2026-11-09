import knex, { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import { down, up } from '../../src/db/migrations/1793836843_rename_type_metadata_table';

async function migrationSql(migrate: (db: Knex) => Promise<void>): Promise<string[]> {
	const db = knex({ client: 'mysql2' });
	const statements: string[] = [];
	const migrationDb = Object.assign(
		(name: string) => ({
			whereNull(column: string) {
				return {
					async update(values: Record<string, string>) {
						statements.push(db(name).whereNull(column).update(values).toQuery());
					},
				};
			},
		}),
		{
			schema: {
				async renameTable(from: string, to: string) {
					statements.push(db.schema.renameTable(from, to).toQuery());
				},
				async alterTable(name: string, callback: (table: Knex.TableBuilder) => void) {
					if (name === 'type_metadata') {
						callback({
							renameColumn(from: string, to: string) {
								statements.push(`rename column ${name}.${from} to ${to}`);
							},
						} as Knex.TableBuilder);
					} else {
						statements.push(db.schema.alterTable(name, callback).toQuery());
					}
				},
			},
		},
	) as unknown as Knex;

	try {
		await migrate(migrationDb);
		return statements;
	} finally {
		await db.destroy();
	}
}

describe('type metadata migration', () => {
	it('backfills legacy rows before requiring a format without a default', async () => {
		const statements = await migrationSql(up);
		expect(statements).toHaveLength(5);
		expect(statements[0]).toContain('alter table `vct` add `format` varchar(255) null');
		expect(statements[0]).toContain(
			"add constraint type_metadata_format_check check(`format` in ('dc+sd-jwt'))",
		);
		expect(statements[1]).toBe(
			"update `vct` set `format` = 'dc+sd-jwt' where `format` is null",
		);
		expect(statements[2]).toContain('`format` varchar(255) not null');
		expect(statements.join(' ')).not.toMatch(/default/i);
		expect(statements.slice(3)).toEqual([
			'rename table `vct` to `type_metadata`',
			'rename column type_metadata.urn to identifier',
		]);
	});

	it('removes the format column on rollback', async () => {
		expect(await migrationSql(down)).toEqual([
			'rename column type_metadata.identifier to urn',
			'rename table `type_metadata` to `vct`',
			'alter table `vct` drop `format`',
		]);
	});
});
