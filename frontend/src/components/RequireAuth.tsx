import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export function RequireAuth() {
	const { auth, checking, sessionExpired } = useAuth();

	if (checking) {
		return <div className="text-center text-sm text-gray-500">Checking session…</div>;
	}

	// When the session expires on this page, stay so the user can log in again without losing their work.
	if (!auth.loggedIn && !sessionExpired) return <Navigate to="/metadata" replace />;

	return <Outlet />;
}
