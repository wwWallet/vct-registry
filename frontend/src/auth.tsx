import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuthState, isUnauthorizedError } from './api/client';
import type { AuthState } from './types';

interface AuthContextValue {
	auth: AuthState;
	checking: boolean;
	loginOpen: boolean;
	notice: string;
	/** The session expired on the current page; stays set until the user logs in or navigates. */
	sessionExpired: boolean;
	updateAuth: (auth: AuthState) => void;
	handleAuthError: (reason: unknown) => boolean;
	openLogin: () => void;
	closeLogin: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const location = useLocation();
	const routeKey = `${location.pathname}${location.search}`;
	const [auth, setAuth] = useState<AuthState>({ loggedIn: false, username: '' });
	const [checkedRoute, setCheckedRoute] = useState('');
	const [loginOpen, setLoginOpen] = useState(false);
	const [notice, setNotice] = useState('');
	const [sessionExpired, setSessionExpired] = useState(false);
	const checking = checkedRoute !== routeKey;

	const updateAuth = useCallback((nextAuth: AuthState) => {
		setAuth(nextAuth);
		if (nextAuth.loggedIn) {
			setNotice('');
			setSessionExpired(false);
		}
	}, []);
	const openLogin = useCallback(() => setLoginOpen(true), []);
	const closeLogin = useCallback(() => setLoginOpen(false), []);

	const expireSession = useCallback(() => {
		setAuth({ loggedIn: false, username: '' });
		setNotice('Session expired. Log in again.');
		setSessionExpired(true);
		setLoginOpen(true);
	}, []);
	const handleAuthError = useCallback(
		(reason: unknown) => {
			if (!isUnauthorizedError(reason)) return false;
			expireSession();
			return true;
		},
		[expireSession],
	);

	useEffect(() => {
		let active = true;
		setSessionExpired(false);
		void getAuthState().then((nextAuth) => {
			if (active) {
				updateAuth(nextAuth);
				setCheckedRoute(routeKey);
			}
		});
		return () => {
			active = false;
		};
	}, [routeKey, updateAuth]);

	return (
		<AuthContext.Provider
			value={{
				auth,
				checking,
				loginOpen,
				notice,
				sessionExpired,
				updateAuth,
				handleAuthError,
				openLogin,
				closeLogin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within AuthProvider.');
	return context;
}
