import knex, { Knex } from 'knex';
import { describe, expect, it } from 'vitest';
import {
	getAllTypeMetadata,
	getTypeMetadataByIdentifier,
	getTypeMetadataList,
} from '../../src/db/typeMetadata';

// Compile real queries while substituting their execution results; no database is required.
async function captureQuery(result: unknown, action: (db: Knex) => Promise<unknown>) {
	const compiler = knex({ client: 'mysql2' });
	const queries: Knex.Sql[] = [];
	const db = ((table: string) => {
		const query = compiler(table);
		query.then = (resolve, reject) => {
			queries.push(query.toSQL());
			return Promise.resolve(result).then(resolve, reject);
		};
		return query;
	}) as Knex;
	try {
		return { value: await action(db), queries };
	} finally {
		await compiler.destroy();
	}
}

describe('type metadata database queries', () => {
	it.each(['dc+sd-jwt', 'mso_mdoc'] as const)('filters by identifier and %s', async (format) => {
		const metadata = { name: 'Example' };
		const { value, queries } = await captureQuery(
			{ metadata: JSON.stringify(metadata) },
			(db) => getTypeMetadataByIdentifier(db, 'example', format),
		);
		expect(value).toEqual(metadata);
		expect(queries[0].sql).toContain('where `identifier` = ? and `format` = ?');
		expect(queries[0].bindings).toEqual(['example', format, 1]);
	});

	it('looks up an identifier without restricting the format when omitted', async () => {
		const { value, queries } = await captureQuery(undefined, (db) =>
			getTypeMetadataByIdentifier(db, 'example'),
		);
		expect(value).toBeUndefined();
		expect(queries[0].sql).not.toContain('`format`');
		expect(queries[0].bindings).toEqual(['example', 1]);
	});

	it.each(['dc+sd-jwt', 'mso_mdoc'] as const)(
		'filters metadata collections by %s',
		async (format) => {
			const metadata = { name: 'Example' };
			const { value, queries } = await captureQuery(
				[{ metadata: JSON.stringify(metadata) }],
				(db) => getAllTypeMetadata(db, format),
			);
			expect(value).toEqual([metadata]);
			expect(queries[0].sql).toContain('where `format` = ?');
			expect(queries[0].bindings).toEqual([format]);
		},
	);

	it('leaves collections unfiltered when format is omitted', async () => {
		const { queries } = await captureQuery([], getAllTypeMetadata);
		expect(queries[0].sql).not.toContain('where');
	});

	it('builds summaries using stored identifiers and formats for both JSON representations', async () => {
		const rows = [
			{ identifier: 'a', format: 'dc+sd-jwt', metadata: JSON.stringify({ name: 'A' }) },
			{ identifier: 'b', format: 'mso_mdoc', metadata: { name: 'B' } },
		];
		const { value } = await captureQuery(rows, getTypeMetadataList);
		expect(value).toEqual([
			{ identifier: 'a', format: 'dc+sd-jwt', name: 'A' },
			{ identifier: 'b', format: 'mso_mdoc', name: 'B' },
		]);
	});
});
