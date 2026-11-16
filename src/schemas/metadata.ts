import { ClaimMetadataEntry, IntegrityString, TypeDisplayEntry, TypeMetadata } from 'wallet-common';
import { z } from 'zod';

export const MsoMdocTypeMetadata = z
	.object({
		doctype: z.string().nonempty('Doctype cannot be empty'),
		name: z.string().optional(),
		description: z.string().optional(),

		extends: z.string().optional(),
		['extends#integrity']: IntegrityString.optional(),

		display: z.array(TypeDisplayEntry).optional(), // §8
		claims: z.array(ClaimMetadataEntry).optional(), // §9

		// §7 integrity for the doctype reference when used
		['doctype#integrity']: IntegrityString.optional(),
	})
	.strip() // remove unknown fields but don't error
	.superRefine((val, ctx) => {
		const ids = new Set<string>();
		val.claims?.forEach((c, i) => {
			if (c.svg_id) {
				if (ids.has(c.svg_id)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `svg_id "${c.svg_id}" must be unique within the type metadata`,
						path: ['claims', i, 'svg_id'],
					});
				}
				ids.add(c.svg_id);
			}
		});
	});
/** ---------- Exported Types ---------- */
export type MsoMdocTypeMetadata = z.infer<typeof MsoMdocTypeMetadata>;

export type RegistryMetadata = TypeMetadata | MsoMdocTypeMetadata;
export type MetadataFormat = 'dc+sd-jwt' | 'mso_mdoc';

export function getMetadataId(metadata: RegistryMetadata): string {
	return 'vct' in metadata ? metadata.vct : metadata.doctype;
}
