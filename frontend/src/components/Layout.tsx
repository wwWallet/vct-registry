import { NavLink, Outlet } from 'react-router-dom';
import type { AuthState } from '../types';
import { AuthControls } from './AuthControls';

const navClass = ({ isActive }: { isActive: boolean }) =>
	`relative inline-flex min-h-8 items-center whitespace-nowrap bg-transparent px-1 py-1.5 text-base leading-[normal] no-underline transition-colors after:absolute after:right-1 after:bottom-[3px] after:left-1 after:h-0.5 after:origin-center after:rounded-full after:transition-transform ${
		isActive
			? 'font-semibold text-[var(--vct-text)] after:scale-x-100 after:bg-vct-accent'
			: 'text-[var(--vct-text-muted)] after:scale-x-0 after:bg-[var(--vct-border-strong)] hover:text-[var(--vct-text)] hover:after:scale-x-100'
	}`;

interface LayoutProps {
	auth: AuthState;
	onAuthChange: (auth: AuthState) => void;
}

export function Layout({ auth, onAuthChange }: LayoutProps) {
	return (
		<div>
			<a
				className="absolute top-[-44px] left-3 z-50 rounded-lg bg-[var(--vct-text)] px-2.5 py-2 text-sm text-white no-underline transition-[top] focus:top-3"
				href="#main-content"
			>
				Skip to main content
			</a>
			<header
				className="header border-b border-[var(--vct-border)] bg-[linear-gradient(180deg,rgba(255,255,255,.95)_0%,rgba(243,248,250,.92)_100%)] px-5 py-4 backdrop-blur-[10px] max-[680px]:px-4 max-[680px]:py-3 max-[520px]:px-3 max-[520px]:py-2.5"
				role="banner"
			>
				<div className="header-inner mx-auto grid max-w-267.5 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 max-[680px]:grid-cols-[minmax(0,1fr)_auto] max-[680px]:gap-y-2.5 max-[520px]:gap-2.5">
					<div className="min-w-0">
						<NavLink
							className="flex min-w-0 items-center gap-3 no-underline max-[520px]:gap-2.25"
							to="/"
						>
							<img
								className="block size-10.5 shrink-0"
								src="/images/logo.svg"
								alt="wwWallet logo"
							/>
							<div className="min-w-0">
								<p className="mb-0.5 text-[.72rem] font-bold tracking-[.08em] text-vct-accent uppercase">
									wwWallet
								</p>
								<h1 className="m-0 text-[1.45rem] leading-[1.15] font-bold text-[var(--vct-text)]">
									VCT Registry
								</h1>
							</div>
						</NavLink>
					</div>
					<nav
						className="header-nav flex min-w-0 flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 justify-self-center max-[680px]:col-span-2 max-[680px]:row-start-2 max-[680px]:w-full max-[520px]:justify-start max-[520px]:flex-nowrap max-[520px]:gap-3.5 max-[520px]:overflow-x-auto max-[520px]:px-0.5 max-[520px]:pb-1.5"
						aria-label="Primary"
					>
						<NavLink to="/" className={navClass} end>
							Home
						</NavLink>
						<NavLink to="/metadata" className={navClass}>
							Metadata
						</NavLink>
						<NavLink to="/usage" className={navClass}>
							Usage
						</NavLink>
					</nav>
					<div className="flex min-w-0 items-center justify-self-end gap-2">
						<AuthControls auth={auth} onAuthChange={onAuthChange} />
					</div>
				</div>
			</header>
			<main id="main-content" className="container mx-auto mt-8 mb-10 max-w-275 px-4">
				<Outlet />
			</main>
		</div>
	);
}
