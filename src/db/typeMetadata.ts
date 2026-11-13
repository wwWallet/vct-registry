import { Knex } from 'knex';
import { getMetadataId } from '../schemas/metadata';
import type { MetadataFormat, RegistryMetadata } from '../schemas/metadata';

export async function runMigrations(knex: Knex) {
	try {
		await knex.migrate.latest();
	} catch (error) {
		console.error('Error running database migrations: ', error);
	}
}

/**
 * Insert a new type metadata entry.
 * @returns number of inserted rows, or -1 on error
 */
export async function createTypeMetadata(
	knex: Knex,
	identifier: string,
	metadata: object,
	format: MetadataFormat,
): Promise<number> {
	try {
		const result = await knex('type_metadata').insert({
			identifier: identifier,
			metadata: metadata,
			format,
		});
		return result.length;
	} catch (error) {
		console.error('Error creating type metadata: ', error);
		return -1;
	}
}

export async function getTypeMetadataByIdentifier(
	knex: Knex,
	identifier: string,
	format?: MetadataFormat,
): Promise<RegistryMetadata | undefined> {
	try {
		const query = knex('type_metadata').where('identifier', identifier);
		if (format !== undefined) query.andWhere('format', format);
		const result = await query.select('metadata').first();
		return result ? parseMetadata(result.metadata) : undefined;
	} catch (error) {
		console.error('Error fetching type metadata: ', error);
		return undefined;
	}
}

export async function getTypeMetadataList(
	knex: Knex,
): Promise<Array<{ identifier: string; format: MetadataFormat; name?: string }>> {
	const rows = await knex('type_metadata').select('identifier', 'format', 'metadata');
	return rows.map((row) => ({
		identifier: row.identifier,
		format: row.format,
		name: parseMetadata(row.metadata).name,
	}));
}

/**
 * Should update exactly one type metadata entry.
 * @returns the number of updated rows, or -1 on error
 */
export async function updateTypeMetadataByIdentifier(
	knex: Knex,
	identifier: string,
	metadata: object,
): Promise<number> {
	try {
		const parsedMetadata = metadata as RegistryMetadata;
		if (getMetadataId(parsedMetadata) !== identifier) {
			throw new Error(
				`Cannot change type metadata identifier. Got identifier '${getMetadataId(parsedMetadata)}' in metadata while editing type metadata '${identifier}'.`,
			);
		}

		const result: number = await knex('type_metadata')
			.where('identifier', identifier)
			.update({
				metadata: JSON.stringify(metadata),
			});

		if (result === 0) {
			console.warn(`No type metadata found with identifier "${identifier}" to update.`);
		} else if (result > 1) {
			console.warn(
				`Multiple type metadata entries updated with identifier "${identifier}". This should not happen if "identifier" is unique.`,
			);
		}

		return result;
	} catch (error) {
		console.error('Error updating type metadata: ', error);
		return -1;
	}
}

/**
 * Should delete exactly one type metadata entry.
 * @returns the number of deleted rows, or -1 if an error occurred
 */
export async function deleteTypeMetadataByIdentifier(
	knex: Knex,
	identifier: string,
): Promise<number> {
	try {
		const result = await knex('type_metadata').where('identifier', identifier).del();

		if (result === 0) {
			console.warn(`No type metadata found with identifier "${identifier}" to delete.`);
		} else if (result > 1) {
			console.warn(
				`Multiple type metadata entries deleted with identifier "${identifier}". This should not happen if "identifier" is unique.`,
			);
		}

		return result;
	} catch (error) {
		console.error('Error deleting type metadata: ', error);
		return -1;
	}
}

export async function getAllTypeMetadata(
	knex: Knex,
	format?: MetadataFormat,
): Promise<RegistryMetadata[]> {
	try {
		const query = knex('type_metadata').select('metadata');
		if (format !== undefined) query.where('format', format);
		const result: Array<{ metadata: string }> = await query;
		return result.map((row) => parseMetadata(row.metadata));
	} catch (error) {
		console.error('Error fetching type metadata:', error);
		return [];
	}
}

function parseMetadata(value: unknown): RegistryMetadata {
	if (typeof value === 'string') {
		return JSON.parse(value) as RegistryMetadata;
	}

	return value as RegistryMetadata;
}

export async function getTypeMetadataEntry(
	knex: Knex,
	identifier: string,
): Promise<{ format: MetadataFormat; metadata: RegistryMetadata } | undefined> {
	const row = await knex('type_metadata')
		.select('format', 'metadata')
		.where('identifier', identifier)
		.first();
	return row
		? {
				format: row.format,
				metadata: parseMetadata(row.metadata),
			}
		: undefined;
}
