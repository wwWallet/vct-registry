import type { AuthState, TypeMetadata } from '../types';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, { credentials: 'include', ...init });
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new Error(body?.message ?? `Request failed with status ${response.status}.`);
	}
	return response.json() as Promise<T>;
}

export async function getAllMetadata() {
	const metadata = await requestJson<TypeMetadata[]>('/type-metadata/all');
	return Promise.all(
		metadata.map(async (entry) => {
			try {
				const preview = await requestJson<{ dataUri: string }>(
					`/api/vct-preview?vct=${encodeURIComponent(entry.vct)}`,
				);
				return { ...entry, previewDataUri: preview.dataUri };
			} catch {
				return entry;
			}
		}),
	);
}

export function getMetadataSchema(): Promise<object> {
	return requestJson<object>('/type-metadata/schema');
}

export function getAuthState(): Promise<AuthState> {
	return requestJson<{ username?: string }>('/auth')
		.then((body) => ({ loggedIn: true, username: body.username ?? '' }))
		.catch(() => ({ loggedIn: false, username: '' }));
}

export async function login(username: string, password: string): Promise<AuthState> {
	const response = await fetch('/auth/login', {
		credentials: 'include',
		headers: {
			Authorization: `Basic ${btoa(`${username}:${password}`)}`,
			'X-Requested-With': 'XMLHttpRequest',
		},
	});

	if (!response.ok) {
		throw new Error('Invalid username or password.');
	}

	const auth = await getAuthState();
	if (!auth.loggedIn) {
		throw new Error('The session could not be established. Please try again.');
	}
	return auth;
}

export async function logout(): Promise<void> {
	const response = await fetch('/auth/logout', { credentials: 'include' });
	if (!response.ok) {
		throw new Error('Logout failed. Please try again.');
	}
}

function mutationRequest<T>(url: string, body: unknown): Promise<T> {
	return requestJson<T>(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function prepareMetadataIntegrity(metadata: TypeMetadata) {
	const result = await mutationRequest<{ metadata: TypeMetadata }>('/vct/integrity', {
		metadata,
	});
	return result.metadata;
}

export function createMetadata(metadata: TypeMetadata): Promise<{ message: string }> {
	return mutationRequest('/vct/create', { vct: metadata.vct, metadata });
}

export function updateMetadata(
	originalVct: string,
	metadata: TypeMetadata,
): Promise<{ message: string }> {
	return mutationRequest('/vct/edit', { vct: originalVct, metadata });
}

export function deleteMetadata(vct: string): Promise<{ message: string }> {
	return mutationRequest('/vct/delete', { vct });
}
