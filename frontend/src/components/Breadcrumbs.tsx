import { Link } from 'react-router-dom';

interface BreadcrumbsProps {
	current: string;
	parent?: { label: string; to: string };
}

export function Breadcrumbs({ current, parent }: BreadcrumbsProps) {
	return (
		<nav className="breadcrumbs mb-4.5" aria-label="Breadcrumb">
			<ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-sm text-[var(--vct-text-muted)]">
				<li className="inline-flex items-center gap-2 after:text-[var(--vct-border-strong)] after:content-['/']">
					<Link
						className="text-[var(--vct-text-muted)] no-underline hover:text-[var(--vct-text)] hover:underline hover:underline-offset-3"
						to="/"
					>
						Home
					</Link>
				</li>
				{parent && (
					<li className="inline-flex items-center gap-2 after:text-[var(--vct-border-strong)] after:content-['/']">
						<Link
							className="text-[var(--vct-text-muted)] no-underline hover:text-[var(--vct-text)] hover:underline hover:underline-offset-3"
							to={parent.to}
						>
							{parent.label}
						</Link>
					</li>
				)}
				<li className="font-semibold text-[var(--vct-text)]" aria-current="page">
					{current}
				</li>
			</ol>
		</nav>
	);
}
