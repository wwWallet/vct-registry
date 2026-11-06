import { Link } from 'react-router-dom';
import { MetadataCard } from '../components/MetadataCard';
import type { TypeMetadata } from '../types';
import { buttonClass, feedbackClass } from '../ui';

export function HomePage({ metadata, loading, error }: PageProps) {
	return (
		<section className="page-shell flex flex-col gap-4.5">
			<div className="page-header m-0 text-center">
				<h1 className="m-0 text-[1.6rem] leading-[1.1] font-bold text-[var(--vct-text)]">
					Verifiable Credential TypeMetadata Registry
				</h1>
				<p className="mx-auto mt-2.5 max-w-[60ch] text-[.95rem] leading-[1.5] text-[var(--vct-text-muted)]">
					Browse and inspect SD-JWT Verifiable Credential Type metadata from one local
					registry.
				</p>
			</div>
			<div className="mb-5 flex flex-wrap justify-center gap-2.5 text-center">
				<Link
					className={buttonClass('outline', 'w-auto px-4.5 py-2.5 tracking-[.01em]')}
					to="/metadata"
				>
					Open Metadata Explorer
				</Link>
			</div>
			{error ? (
				<div className={feedbackClass.error}>{error}</div>
			) : loading ? (
				<div className="mb-3 text-center text-sm text-gray-500">
					Loading metadata entries…
				</div>
			) : metadata.length ? (
				<div className="home-cards flex flex-wrap justify-center gap-3">
					{metadata.map((item) => (
						<MetadataCard key={item.vct} metadata={item} />
					))}
				</div>
			) : (
				<div className="mb-3 text-center text-sm text-gray-500">
					No metadata entries found.
				</div>
			)}
		</section>
	);
}

interface PageProps {
	metadata: TypeMetadata[];
	loading: boolean;
	error: string;
}
