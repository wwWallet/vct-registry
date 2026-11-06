import { useEffect, useRef, useState } from 'react';
import { login, logout } from '../api/client';
import type { AuthState } from '../types';
import { buttonClass, feedbackClass } from '../ui';

interface AuthControlsProps {
	auth: AuthState;
	onAuthChange: (auth: AuthState) => void;
}

export function AuthControls({ auth, onAuthChange }: AuthControlsProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (dialogOpen && !dialog.open) dialog.showModal();
		if (!dialogOpen && dialog.open) dialog.close();
	}, [dialogOpen]);

	useEffect(() => {
		if (!menuOpen) return;
		const closeMenu = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		document.addEventListener('mousedown', closeMenu);
		return () => document.removeEventListener('mousedown', closeMenu);
	}, [menuOpen]);

	async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setSubmitting(true);
		const formElement = event.currentTarget;
		const form = new FormData(formElement);
		try {
			const nextAuth = await login(
				String(form.get('username') ?? '').trim(),
				String(form.get('password') ?? ''),
			);
			onAuthChange(nextAuth);
			formElement.reset();
			setDialogOpen(false);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Login failed.');
		} finally {
			setSubmitting(false);
		}
	}

	async function handleLogout() {
		setMenuOpen(false);
		try {
			await logout();
			onAuthChange({ loggedIn: false, username: '' });
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Logout failed.');
			setDialogOpen(true);
		}
	}

	return (
		<>
			{auth.loggedIn ? (
				<div className="relative" ref={menuRef}>
					<button
						type="button"
						className="grid size-10 cursor-pointer place-items-center rounded-full border border-[var(--vct-border)] bg-[var(--vct-surface-alt)] p-0 transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-[var(--vct-border-strong)] hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--vct-accent-ring)] aria-expanded:border-vct-accent aria-expanded:bg-white aria-expanded:ring-3 aria-expanded:ring-[var(--vct-accent-ring-soft)] max-[520px]:size-9.5"
						title="Open user menu"
						aria-label="Open user menu"
						aria-haspopup="menu"
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
					>
						<svg
							className="size-5 text-[#5a685f]"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<circle cx="12" cy="8" r="4" />
							<path d="M4 21a8 8 0 0 1 16 0Z" />
						</svg>
					</button>
					{menuOpen && (
						<div
							className="absolute top-[calc(100%+.5rem)] right-0 z-30 max-h-[min(360px,calc(100vh-96px))] w-[min(208px,calc(100vw-32px))] min-w-[min(184px,calc(100vw-32px))] overflow-y-auto rounded-lg border border-[var(--vct-border)] bg-white py-1.5 shadow-[0_16px_32px_rgba(29,42,34,.14)] max-[520px]:right-[-2px] max-[520px]:w-[min(208px,calc(100vw-24px))] max-[520px]:min-w-[min(184px,calc(100vw-24px))]"
							role="menu"
						>
							<div className="px-3.5 pt-3 pb-2.5">
								<p className="m-0 text-xs leading-[1.25] text-[var(--vct-text-muted)]">
									Signed in as
								</p>
								<p className="mt-0.5 mb-0 truncate text-[.9rem] leading-[1.35] font-semibold text-[var(--vct-text)]">
									{auth.username || 'User'}
								</p>
							</div>
							<div className="my-1.5 h-px bg-[var(--vct-border)]" />
							<button
								type="button"
								className="flex min-h-11 w-full cursor-pointer items-center border-0 bg-transparent px-3.5 py-2.5 text-left text-[.9rem] leading-[1.25] text-[#dc2626] hover:bg-[var(--vct-surface-alt)] focus-visible:bg-[var(--vct-surface-alt)] focus-visible:outline-none"
								role="menuitem"
								onClick={() => void handleLogout()}
							>
								Log out
							</button>
						</div>
					)}
				</div>
			) : (
				<button
					type="button"
					className={buttonClass(
						'primary',
						'px-5 hover:-translate-y-px max-[520px]:min-h-9.5 max-[520px]:px-3.5',
					)}
					onClick={() => {
						setError('');
						setDialogOpen(true);
					}}
				>
					Login
				</button>
			)}

			<dialog
				ref={dialogRef}
				aria-labelledby="react-login-title"
				className="m-auto w-[min(420px,calc(100vw-32px))] rounded-xl border-0 bg-white p-0 text-[var(--vct-text)] shadow-[0_20px_40px_rgba(0,0,0,.2)] backdrop:bg-[rgba(29,42,34,.4)]"
				onCancel={() => setDialogOpen(false)}
				onClose={() => setDialogOpen(false)}
				onClick={(event) => {
					if (event.target === event.currentTarget) setDialogOpen(false);
				}}
			>
				<form
					className="flex flex-col gap-2 p-4"
					onSubmit={(event) => void handleLogin(event)}
				>
					<div>
						<h2
							id="react-login-title"
							className="mt-0 mr-0 mb-1 ml-0 text-[1.1rem] font-bold"
						>
							Login
						</h2>
					</div>
					<label className="grid gap-1.5 text-[.85rem] text-[var(--vct-text-muted)]">
						Username
						<input
							className="w-full rounded-lg border border-[var(--vct-border)] bg-white p-2.5 text-[.9rem] font-normal outline-none focus:border-vct-accent focus:ring-3 focus:ring-[var(--vct-accent-ring-soft)]"
							name="username"
							type="text"
							autoComplete="username"
							autoFocus
							required
						/>
					</label>
					<label className="grid gap-1.5 text-[.85rem] text-[var(--vct-text-muted)]">
						Password
						<input
							className="w-full rounded-lg border border-[var(--vct-border)] bg-white p-2.5 text-[.9rem] font-normal outline-none focus:border-vct-accent focus:ring-3 focus:ring-[var(--vct-accent-ring-soft)]"
							name="password"
							type="password"
							autoComplete="current-password"
							required
						/>
					</label>
					{error && (
						<p
							className={`${feedbackClass.error} my-1 py-2 pr-2.5 pl-2.5 text-[.8rem]`}
							role="alert"
						>
							{error}
						</p>
					)}
					<div className="mt-1.5 flex justify-end gap-2">
						<button
							type="button"
							className={buttonClass('secondary')}
							onClick={() => setDialogOpen(false)}
						>
							Cancel
						</button>
						<button
							type="submit"
							className={buttonClass('primary', 'disabled:cursor-wait')}
							disabled={submitting}
						>
							{submitting ? 'Signing in…' : 'Sign in'}
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
