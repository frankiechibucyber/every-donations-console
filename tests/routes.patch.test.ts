import {beforeEach, describe, expect, it} from 'vitest';
import {PATCH} from '@/app/api/donations/[uuid]/status/route';
import {resetRepositoryForTests} from '@/server/container';
import {SEED_DONATIONS} from '@/data/seed';
import {jsonRequest} from './helpers';

const NEW_DONATION_UUID = SEED_DONATIONS[0]!.uuid;
const PENDING_DONATION_UUID = SEED_DONATIONS[2]!.uuid;

function patch(uuid: string, body: unknown) {
	return PATCH(
		jsonRequest(`http://localhost/api/donations/${uuid}/status`, {
			method: 'PATCH',
			body
		}),
		{params: Promise.resolve({uuid})}
	);
}

describe('PATCH /donations/:uuid/status', () => {
	beforeEach(() => resetRepositoryForTests());

	it('new -> pending returns 200 with updated record and one transition logged', async () => {
		const res = await patch(NEW_DONATION_UUID, {status: 'pending'});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe('pending');
		expect(body.transitions).toHaveLength(1);
		expect(body.transitions[0]).toMatchObject({
			from: 'new',
			to: 'pending'
		});
		expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(
			new Date(body.createdAt).getTime()
		);
	});

	it('same status returns 409 NO_OP and leaves record unchanged', async () => {
		const res = await patch(NEW_DONATION_UUID, {status: 'new'});
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body.error.code).toBe('NO_OP');
	});

	it('new -> failure returns 422 INVALID_TRANSITION with allowedFromHere', async () => {
		const res = await patch(NEW_DONATION_UUID, {status: 'failure'});
		expect(res.status).toBe(422);
		const body = await res.json();
		expect(body.error.code).toBe('INVALID_TRANSITION');
		expect(body.error.details).toMatchObject({
			from: 'new',
			to: 'failure',
			allowedFromHere: ['pending']
		});
	});

	it('returns 404 when uuid does not exist', async () => {
		const res = await patch('uuid-not-here', {status: 'pending'});
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error.code).toBe('DONATION_NOT_FOUND');
	});

	it('pending -> success returns 200 and emits webhook-like terminal event', async () => {
		const res = await patch(PENDING_DONATION_UUID, {status: 'success'});
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe('success');
		expect(body.transitions).toHaveLength(1);
	});

	it('returns 400 INVALID_PAYLOAD when status is not in the enum', async () => {
		const res = await patch(NEW_DONATION_UUID, {status: 'bogus'});
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error.code).toBe('INVALID_PAYLOAD');
	});
});
