import { metadataId, metadataFormat } from '../types';
import type { AuthState, TypeMetadata, MetadataFormat, MetadataEntry } from '../types';

class RequestError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, { credentials: 'include', ...init });
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		throw new RequestError(
			body?.message ?? `Request failed with status ${response.status}.`,
			response.status,
		);
	}
	return response.json() as Promise<T>;
}

export function isUnauthorizedError(reason: unknown): boolean {
	return reason instanceof RequestError && reason.status === 401;
}

export function getAllMetadata(): Promise<TypeMetadata[]> {
	return requestJson('/type-metadata/all');
}

export function getMetadata(identifier: string, signal?: AbortSignal): Promise<TypeMetadata> {
	return requestJson(`/type-metadata?identifier=${encodeURIComponent(identifier)}`, { signal });
}

export async function getMetadataPreview(identifier: string, signal?: AbortSignal) {
	const preview = await requestJson<{ dataUri: string | null }>(
		`/api/type-metadata-preview?identifier=${encodeURIComponent(identifier)}`,
		{ signal },
	);
	return preview.dataUri;
}

export function getMetadataSchema(format: MetadataFormat = 'dc+sd-jwt'): Promise<object> {
	return requestJson<object>(`/type-metadata/schema/${encodeURIComponent(format)}`);
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

export function createMetadata(metadata: TypeMetadata): Promise<{ message: string }> {
	return mutationRequest('/api/type-metadata/create', {
		identifier: metadataId(metadata),
		format: metadataFormat(metadata),
		metadata,
	});
}

export function updateMetadata(
	identifier: string,
	metadata: TypeMetadata,
): Promise<{ message: string }> {
	return mutationRequest('/api/type-metadata/edit', { identifier, metadata });
}

export function deleteMetadata(identifier: string): Promise<{ message: string }> {
	return mutationRequest('/api/type-metadata/delete', { identifier });
}

export function getMetadataEntry(identifier: string, signal?: AbortSignal): Promise<MetadataEntry> {
	return requestJson(`/api/type-metadata/entry?identifier=${encodeURIComponent(identifier)}`, {
		signal,
	});
}
