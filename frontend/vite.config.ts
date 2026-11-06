import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, import.meta.dirname, '');
	const backendUrl = env.VITE_REGISTRY_API_URL || 'http://localhost:8097';

	return {
		root: import.meta.dirname,
		base: '/',
		plugins: [react(), tailwindcss()],
		build: {
			outDir: '../dist/public/react',
			emptyOutDir: true,
		},
		server: {
			port: 8098,
			strictPort: true,
			proxy: {
				'/api': backendUrl,
				'/auth': backendUrl,
				'/type-metadata': backendUrl,
				'/vct': backendUrl,
			},
		},
	};
});
