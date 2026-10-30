import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';

describe('Type Metadata JSON Schema', () => {
	it('should have correct top-level type and properties', async () => {
		const { body: schema } = await request(app)
			.get('/type-metadata/schema')
			.expect(200)
			.expect('Content-Type', /json/);

		expect(schema.type).toBe('object');

		['vct', 'name', 'description', 'display', 'claims'].forEach((key) => {
			expect(schema.properties).toHaveProperty(key);
		});

		expect(schema.additionalProperties).toBe(false);
		expect(schema.properties.display.items.additionalProperties).toBe(false);
		expect(schema.properties.claims.items.additionalProperties).toBe(false);
	});
});
