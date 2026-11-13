import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));
afterEach(() => vi.unstubAllEnvs());

describe('metadata size configuration', () => {
	it.each([
		[undefined, undefined, 102400],
		[undefined, '204800', 204800],
		['307200', undefined, 307200],
		['307200', '204800', 307200],
	] as const)(
		'resolves MAX_METADATA_SIZE=%s and MAX_VCT_SIZE=%s',
		async (current, legacy, expected) => {
			vi.resetModules();
			vi.stubEnv('MAX_METADATA_SIZE', current);
			vi.stubEnv('MAX_VCT_SIZE', legacy);
			const { config } = await import('../../config');
			expect(config.max_metadata_size).toBe(expected);
		},
	);
});
