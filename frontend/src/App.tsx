import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getAllMetadata, getAuthState } from './api/client';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MetadataPage } from './pages/MetadataPage';
import { UsagePage } from './pages/UsagePage';
import type { AuthState, TypeMetadata } from './types';

const MetadataEditorPage = lazy(() =>
	import('./pages/MetadataEditorPage').then((module) => ({
		default: module.MetadataEditorPage,
	})),
);

function EditorFallback() {
	return <div className="text-center text-sm text-gray-500">Loading editor…</div>;
}

export default function App() {
	const [metadata, setMetadata] = useState<TypeMetadata[]>([]);
	const [auth, setAuth] = useState<AuthState>({ loggedIn: false, username: '' });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const loadMetadata = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const entries = await getAllMetadata();
			setMetadata([...entries].reverse());
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : 'Failed to load metadata.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void getAuthState().then(setAuth);
		void loadMetadata();
	}, [loadMetadata]);

	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout auth={auth} onAuthChange={setAuth} />}>
					<Route
						index
						element={<HomePage metadata={metadata} loading={loading} error={error} />}
					/>
					<Route
						path="metadata"
						element={
							<MetadataPage
								metadata={metadata}
								loading={loading}
								error={error}
								auth={auth}
								onMetadataChanged={loadMetadata}
							/>
						}
					/>
					<Route
						path="add"
						element={
							<Suspense fallback={<EditorFallback />}>
								<MetadataEditorPage
									mode="add"
									metadata={metadata}
									loading={loading}
									auth={auth}
									onSaved={loadMetadata}
								/>
							</Suspense>
						}
					/>
					<Route
						path="edit"
						element={
							<Suspense fallback={<EditorFallback />}>
								<MetadataEditorPage
									mode="edit"
									metadata={metadata}
									loading={loading}
									auth={auth}
									onSaved={loadMetadata}
								/>
							</Suspense>
						}
					/>
					<Route path="usage" element={<UsagePage />} />
					<Route
						path="*"
						element={<HomePage metadata={metadata} loading={loading} error={error} />}
					/>
				</Route>
			</Routes>
		</BrowserRouter>
	);
}
