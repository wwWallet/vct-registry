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
	const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
	const copied = status === 'copied';
	const currentLabel = copied ? 'Copied' : status === 'failed' ? 'Copy failed' : label;
	const statusClass =
		status === 'copied'
			? 'border-vct-accent bg-[var(--vct-accent-soft)] text-vct-accent'
			: status === 'failed'
				? 'border-[var(--vct-danger-border)] bg-[var(--vct-danger-soft)] text-vct-danger'
				: 'border-[var(--vct-border)] text-[var(--vct-text-muted)] hover:border-[var(--vct-border-strong)] hover:bg-[var(--vct-surface-alt)] hover:text-[var(--vct-text)]';
	async function copy() {
		try {
			// Throws when the Clipboard API is missing, e.g. over plain http.
			await navigator.clipboard.writeText(value);
			setStatus('copied');
		} catch {
			setStatus('failed');
		}
		window.setTimeout(() => setStatus('idle'), 1400);
	}

	return (
		<button
			className={`inline-grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border bg-white p-0 transition-[color,border-color,background-color,box-shadow,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--vct-accent-ring)] ${statusClass} ${className}`}
			type="button"
			onClick={() => void copy()}
			aria-label={currentLabel}
			title={currentLabel}
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
