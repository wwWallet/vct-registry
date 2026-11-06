import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { getAllMetadata } from './api/client';
import { AuthProvider } from './auth';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { MetadataPage } from './pages/MetadataPage';
import { UsagePage } from './pages/UsagePage';
import type { TypeMetadata } from './types';

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
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const latestLoad = useRef(0);

	const loadMetadata = useCallback(async () => {
		latestLoad.current += 1;
		const load = latestLoad.current;
		// Ignore responses from older loads that finish after a newer one.
		const isLatest = () => load === latestLoad.current;
		setLoading(true);
		setError('');
		try {
			const entries = await getAllMetadata();
			if (isLatest()) setMetadata([...entries].reverse());
		} catch (reason) {
			if (isLatest()) {
				setError(reason instanceof Error ? reason.message : 'Failed to load metadata.');
			}
		} finally {
			if (isLatest()) setLoading(false);
		}
	}, []);
	useEffect(() => {
		void loadMetadata();
	}, [loadMetadata]);

	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route element={<Layout />}>
						<Route
							index
							element={
								<HomePage metadata={metadata} loading={loading} error={error} />
							}
						/>
						<Route
							path="metadata"
							element={
								<MetadataPage
									metadata={metadata}
									loading={loading}
									error={error}
									onMetadataChanged={loadMetadata}
								/>
							}
						/>
						<Route element={<RequireAuth />}>
							<Route
								path="add"
								element={
									<Suspense fallback={<EditorFallback />}>
										<MetadataEditorPage mode="add" onSaved={loadMetadata} />
									</Suspense>
								}
							/>
							<Route
								path="edit"
								element={
									<Suspense fallback={<EditorFallback />}>
										<MetadataEditorPage mode="edit" onSaved={loadMetadata} />
									</Suspense>
								}
							/>
						</Route>
						<Route path="usage" element={<UsagePage />} />
						<Route
							path="*"
							element={
								<HomePage metadata={metadata} loading={loading} error={error} />
							}
						/>
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}
