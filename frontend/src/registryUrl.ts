const configuredRegistryApiUrl = import.meta.env.VITE_REGISTRY_API_URL as string | undefined;

export const registryApiUrl = (configuredRegistryApiUrl || window.location.origin).replace(
	/\/+$/,
	'',
);
