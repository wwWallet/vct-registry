import { useState } from 'react';

export function CopyButton({
	value,
	label = 'Copy',
	className = '',
}: {
	value: string;
	label?: string;
	className?: string;
}) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1400);
	}

	return (
		<button
			className={`copy-btn inline-flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-white p-0 transition ${copied ? 'border-vct-accent text-vct-accent' : 'border-[var(--vct-border)] text-[var(--vct-text-muted)] hover:border-[var(--vct-border-strong)] hover:bg-[var(--vct-surface-alt)] hover:text-[var(--vct-text)]'} ${className}`}
			type="button"
			onClick={() => void copy()}
			aria-label={copied ? 'Copied' : label}
			title={copied ? 'Copied' : label}
		>
			<svg
				className="size-4 fill-none stroke-current stroke-[1.7]"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<rect x="8" y="8" width="11" height="11" rx="2" />
				<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
			</svg>
		</button>
	);
}
