import { Knex } from "knex";

const legacyRegistryUrlPrefix = /^https:\/\/([a-z0-9-]+)\.wwwallet\.org\/vct-registry\//i;

function migrateImageUrls(value: unknown, reverse = false): unknown {
	if (typeof value === "string") {
		return reverse
			? value.replace(
					/^https:\/\/([a-z0-9-]+)-registry\.wwwallet\.org\//i,
					"https://$1.wwwallet.org/vct-registry/",
				)
			: value.replace(
					legacyRegistryUrlPrefix,
					"https://$1-registry.wwwallet.org/",
				);
	}

	if (Array.isArray(value)) {
		return value.map((item) => migrateImageUrls(item, reverse));
	}

	if (value !== null && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, migrateImageUrls(item, reverse)]),
		);
	}

	return value;
}

async function migrateRows(knex: Knex, reverse = false): Promise<void> {
	const rows = await knex("vct").select("urn", "metadata");

	for (const row of rows) {
		const metadata = typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata;
		const migratedMetadata = migrateImageUrls(metadata, reverse);

		if (JSON.stringify(metadata) !== JSON.stringify(migratedMetadata)) {
			await knex("vct").where("urn", row.urn).update({
				metadata: JSON.stringify(migratedMetadata),
			});
		}
	}
}

export async function up(knex: Knex): Promise<void> {
	await migrateRows(knex);
}

export async function down(knex: Knex): Promise<void> {
	await migrateRows(knex, true);
}
