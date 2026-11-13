export function LoadingFallback({ label }: { label: string }) {
	return (
		<div className="grid min-h-48 place-items-center" role="status" aria-live="polite">
			<span
				className="size-9 animate-spin rounded-full border-3 border-[var(--vct-border)] border-t-vct-accent"
				aria-hidden="true"
			/>
			<span className="sr-only">{label}</span>
		</div>
	);
}
