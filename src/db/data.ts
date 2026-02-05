import { diplomaMetadata } from "../typeMetadata/diploma";
import { ehicMetadata } from "../typeMetadata/ehic";
import { pda1Metadata } from "../typeMetadata/pda1";
import { pidMetadata } from "../typeMetadata/pid";
import { porMetadata } from "../typeMetadata/por";

export const initialDbContent = [
    {
        urn: diplomaMetadata.vct,
        metadata: diplomaMetadata,
    },
    {
        urn: ehicMetadata.vct,
        metadata: ehicMetadata,
    },
    {
        urn: pda1Metadata.vct,
        metadata: pda1Metadata,
    },
    {
        urn: pidMetadata.vct,
        metadata: pidMetadata,
    },
    {
        urn: porMetadata.vct,
        metadata: porMetadata,
    },
];
