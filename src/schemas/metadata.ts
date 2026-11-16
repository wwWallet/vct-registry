import type { TypeMetadata } from 'wallet-common';

export type RegistryMetadata = TypeMetadata;
export type MetadataFormat = 'dc+sd-jwt';

export function getMetadataId(metadata: RegistryMetadata): string {
	return metadata.vct;
}
