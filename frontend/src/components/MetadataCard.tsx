import { metadataId, metadataFormat } from '../types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetadataPreview } from '../api/client';
import type { TypeMetadata } from '../types';

export function MetadataCard({ metadata }: { metadata: TypeMetadata }) {
	const [previewDataUri, setPreviewDataUri] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		void getMetadataPreview(metadataId(metadata), controller.signal)
			.then(setPreviewDataUri)
			.catch(() => undefined);
		return () => controller.abort();
	}, [metadataId(metadata)]);

	return (
		<Link
			className="home-metadata-card flex max-w-90 flex-[0_1_340px] flex-col gap-2 rounded-[14px] border border-[var(--vct-border)] bg-[rgba(255,255,255,.7)] p-3.5 text-inherit no-underline shadow-[0_8px_24px_rgba(29,42,34,.04)] transition hover:-translate-y-0.5 hover:border-vct-accent hover:shadow-[0_14px_30px_rgba(29,42,34,.08)]"
			to={`/metadata?identifier=${encodeURIComponent(metadataId(metadata))}`}
		>
			<div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-[var(--vct-border)] bg-[#f3f8fa]">
				{previewDataUri ? (
					<img
						className="block size-full bg-[#f3f8fa] object-cover object-top"
						src={previewDataUri}
						alt={`${metadata.name || metadataId(metadata)} preview`}
						loading="lazy"
					/>
				) : (
					<span
						className="grid size-full place-items-center text-xl font-bold text-[var(--vct-text-muted)]"
						aria-hidden="true"
					>
						VC
					</span>
				)}
			</div>
			<h3 className="m-0 text-base leading-[normal] font-bold text-[var(--vct-text)]">
				{metadata.name || metadataId(metadata) || 'Unnamed credential'}
			</h3>
			<p className="m-0 break-all font-mono text-[.8rem] leading-[normal] text-[var(--vct-text-muted)]">
				{metadataFormat(metadata)} · {metadataId(metadata)}
			</p>
			<p className="m-0 line-clamp-3 flex-1 text-[.9rem] leading-[normal] text-[var(--vct-text-muted)]">
				{metadata.description || 'No description provided.'}
			</p>
		</Link>
	);
}
