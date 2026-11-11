import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllMetadata } from './api/client';
import type { TypeMetadata } from './types';

const metadataChannelName = 'vct-registry:metadata';

export function useRegistryMetadata() {
	const [metadata, setMetadata] = useState<TypeMetadata[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const latestLoad = useRef(0);
	const channelRef = useRef<BroadcastChannel | null>(null);

	const loadMetadata = useCallback(async () => {
		latestLoad.current += 1;
		const load = latestLoad.current;
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

	useEffect(() => {
		const channel = new BroadcastChannel(metadataChannelName);
		channelRef.current = channel;
		const handleMessage = () => {
			void loadMetadata();
		};

		channel.addEventListener('message', handleMessage);
		return () => {
			channel.removeEventListener('message', handleMessage);
			channel.close();
			channelRef.current = null;
		};
	}, [loadMetadata]);

	const handleMetadataChanged = useCallback(async () => {
		await loadMetadata();
		channelRef.current?.postMessage('metadata-changed');
	}, [loadMetadata]);

	return { metadata, loading, error, handleMetadataChanged };
}
