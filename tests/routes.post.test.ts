import {beforeEach, describe, expect, it} from 'vitest';
import {POST} from '@/app/api/donations/route';
import {resetRepositoryForTests} from '@/server/container';
import {jsonRequest} from './helpers';

const validPayload = {
	uuid: 'test-uuid-new-1',
	amount: 4200,
	currency: 'USD' as const,
	paymentMethod: 'cc' as const,
	nonprofitId: 'org42',
	donorId: 'donor_new',
	status: 'new' as const,
	createdAt: '2026-01-16T09:00:00Z'
};

describe('POST /donations', () => {
	beforeEach(() => resetRepositoryForTests());

	it('creates a donation and returns 201 with the full record', async () => {
		const res = await POST(
			jsonRequest('http://localhost/api/donations', {
				method: 'POST',
				body: validPayload
			})
		);
		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.uuid).toBe(validPayload.uuid);
		expect(body.amount).toBe(4200);
		expect(body.transitions).toEqual([]);
		expect(body.updatedAt).toBe(validPayload.createdAt);
	});

	it('returns 409 DUPLICATE_UUID on a repeat uuid with existing record embedded', async () => {
		await POST(
			jsonRequest('http://localhost/api/donations', {
				method: 'POST',
				body: validPayload
			})
		);
		const res = await POST(
			jsonRequest('http://localhost/api/donations', {
				method: 'POST',
				body: validPayload
			})
		);
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body.error.code).toBe('DUPLICATE_UUID');
		expect(body.error.details.existing.uuid).toBe(validPayload.uuid);
	});

	it('returns 400 INVALID_PAYLOAD on non-positive amount', async () => {
		const res = await POST(
			jsonRequest('http://localhost/api/donations', {
				method: 'POST',
				body: {...validPayload, amount: 0}
			})
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.code).toBe('INVALID_PAYLOAD');
		expect(body.error.details).toBeDefined();
	});

	it('returns 400 INVALID_PAYLOAD when amount is a string', async () => {
		const res = await POST(
			jsonRequest('http://localhost/api/donations', {
				method: 'POST',
				body: {...validPayload, amount: '4200'}
			})
		);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.code).toBe('INVALID_PAYLOAD');
	});
});
