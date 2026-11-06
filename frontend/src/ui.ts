export const cardClass =
	'rounded-[14px] border border-[var(--vct-border)] bg-[rgba(255,255,255,.92)] shadow-vct backdrop-blur-[6px]';

const buttonBase =
	'inline-flex items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-[.85rem] leading-[1.2] font-semibold no-underline transition-[background-color,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--vct-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60';

const buttonVariants = {
	primary:
		'cursor-pointer border-vct-accent bg-vct-accent text-white hover:border-[var(--vct-accent-strong)] hover:bg-[var(--vct-accent-strong)] hover:text-white',
	secondary:
		'cursor-pointer border-[var(--vct-border)] bg-[var(--vct-surface-alt)] text-[var(--vct-text)] hover:border-[var(--vct-border-strong)] hover:bg-[#eef5f7]',
	outline:
		'cursor-pointer border-vct-accent bg-[color-mix(in_srgb,var(--vct-accent)_4%,white)] text-[var(--vct-text)] hover:border-[var(--vct-accent-strong)] hover:bg-[color-mix(in_srgb,var(--vct-accent)_10%,white)] hover:text-[var(--vct-accent-strong)]',
	danger: 'cursor-pointer border-[var(--vct-border)] bg-[var(--vct-surface-alt)] text-vct-danger hover:border-[var(--vct-danger-border)] hover:bg-[var(--vct-danger-soft)] hover:text-vct-danger',
} as const;

export function buttonClass(variant: keyof typeof buttonVariants = 'secondary', className = '') {
	return `${buttonBase} ${buttonVariants[variant]} ${className}`;
}

const feedbackBase =
	'relative my-3 whitespace-pre-line rounded-[10px] border py-3 pr-3.5 pl-4 text-[.9rem] leading-[1.45] shadow-[0_8px_18px_rgba(29,42,34,.05)]';

export const feedbackClass = {
	error: `${feedbackBase} border-[var(--vct-danger-border)] border-l-vct-danger bg-[var(--vct-danger-soft)] text-vct-danger`,
	success: `${feedbackBase} border-[var(--vct-success-border)] border-l-vct-success bg-[var(--vct-success-soft)] text-vct-success`,
	info: `${feedbackBase} border-[var(--vct-accent-border)] border-l-vct-accent bg-[var(--vct-accent-soft)] text-vct-accent`,
};
