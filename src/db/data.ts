import { diplomaMetadata } from "./initialMetadata/diploma";
import { ehicMetadata } from "./initialMetadata/ehic";
import { pda1Metadata } from "./initialMetadata/pda1";
import { pidMetadata } from "./initialMetadata/pid";
import { porMetadata } from "./initialMetadata/por";

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
