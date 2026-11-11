import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { LoadingFallback } from './LoadingFallback';

export function RequireAuth() {
	const { auth, checking, sessionExpired } = useAuth();

	if (checking) {
		return <LoadingFallback label="Checking session…" />;
	}

	// When the session expires on this page, stay so the user can log in again without losing their work.
	if (!auth.loggedIn && !sessionExpired) return <Navigate to="/metadata" replace />;

	return <Outlet />;
}
