import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { MetadataPage } from './pages/MetadataPage';
import { UsagePage } from './pages/UsagePage';
import { useRegistryMetadata } from './useRegistryMetadata';

const MetadataEditorPage = lazy(() =>
	import('./pages/MetadataEditorPage').then((module) => ({
		default: module.MetadataEditorPage,
	})),
);

function EditorFallback() {
	return <div className="text-center text-sm text-gray-500">Loading editor…</div>;
}

export default function App() {
	const { metadata, loading, error, handleMetadataChanged } = useRegistryMetadata();

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
									onMetadataChanged={handleMetadataChanged}
								/>
							}
						/>
						<Route element={<RequireAuth />}>
							<Route
								path="add"
								element={
									<Suspense fallback={<EditorFallback />}>
										<MetadataEditorPage
											mode="add"
											onSaved={handleMetadataChanged}
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
											onSaved={handleMetadataChanged}
										/>
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
