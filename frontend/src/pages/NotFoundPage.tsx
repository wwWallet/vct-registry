import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { buttonClass, cardClass } from '../ui';

export function NotFoundPage() {
	return (
		<>
			<Breadcrumbs current="Page not found" />
			<section className="page-shell flex flex-col gap-4.5">
				<div className={`${cardClass} mx-auto w-full max-w-170 px-6 py-12 text-center`}>
					<p className="mb-2 text-sm font-bold tracking-[.12em] text-vct-accent uppercase">
						Error 404
					</p>
					<h2 className="m-0 text-[1.8rem] leading-tight font-bold text-[var(--vct-text)]">
						Page not found
					</h2>
					<p className="mx-auto mt-3 mb-6 max-w-[50ch] text-[.95rem] leading-[1.6] text-[var(--vct-text-muted)]">
						The address may be incorrect, or the page may have moved.
					</p>
					<Link className={buttonClass('primary')} to="/">
						Back to registry
					</Link>
				</div>
			</section>
		</>
	);
}
