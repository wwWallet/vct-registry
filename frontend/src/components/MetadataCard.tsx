import { Link } from 'react-router-dom';
import type { TypeMetadata } from '../types';

function firstPreview(metadata: TypeMetadata) {
	return metadata.display?.flatMap((item) => item.rendering?.svg_templates ?? [])[0];
}

export function MetadataCard({ metadata }: { metadata: TypeMetadata }) {
	const preview = firstPreview(metadata);
	return (
		<Link
			className="home-metadata-card flex max-w-90 flex-[0_1_340px] flex-col gap-2 rounded-[14px] border border-[var(--vct-border)] bg-[rgba(255,255,255,.7)] p-3.5 text-inherit no-underline shadow-[0_8px_24px_rgba(29,42,34,.04)] transition hover:-translate-y-0.5 hover:border-vct-accent hover:shadow-[0_14px_30px_rgba(29,42,34,.08)]"
			to={`/metadata?vct=${encodeURIComponent(metadata.vct)}`}
		>
			<div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-[var(--vct-border)] bg-[#f3f8fa]">
				{metadata.previewDataUri || preview ? (
					<img
						className="block size-full bg-[#f3f8fa] object-cover object-top"
						src={metadata.previewDataUri || preview?.uri}
						alt={`${metadata.name || metadata.vct} preview`}
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
				{metadata.name || metadata.vct || 'Unnamed credential'}
			</h3>
			<p className="m-0 break-all font-mono text-[.8rem] leading-[normal] text-[var(--vct-text-muted)]">
				{metadata.vct}
			</p>
			<p className="m-0 line-clamp-3 flex-1 text-[.9rem] leading-[normal] text-[var(--vct-text-muted)]">
				{metadata.description || 'No description provided.'}
			</p>
		</Link>
	);
}
