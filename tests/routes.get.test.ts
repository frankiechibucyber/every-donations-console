import {beforeEach, describe, expect, it} from 'vitest';
import {GET as listGet} from '@/app/api/donations/route';
import {GET as singleGet} from '@/app/api/donations/[uuid]/route';
import {NextRequest} from 'next/server';
import {resetRepositoryForTests} from '@/server/container';
import {SEED_DONATIONS} from '@/data/seed';

describe('GET /donations', () => {
	beforeEach(() => resetRepositoryForTests());

	it('returns all eight seeded donations in the spec envelope', async () => {
		const res = await listGet(
			new NextRequest('http://localhost/api/donations')
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body.donations)).toBe(true);
		expect(body.donations).toHaveLength(SEED_DONATIONS.length);
		expect(body.nextCursor).toBeUndefined();
	});

	it('honors ?limit= with a nextCursor when there are more records', async () => {
		const res = await listGet(
			new NextRequest('http://localhost/api/donations?limit=3')
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.donations).toHaveLength(3);
		expect(typeof body.nextCursor).toBe('string');
	});
});

describe('GET /donations/:uuid', () => {
	beforeEach(() => resetRepositoryForTests());

	it('returns the donation when found', async () => {
		const uuid = SEED_DONATIONS[0]!.uuid;
		const res = await singleGet(
			new NextRequest(`http://localhost/api/donations/${uuid}`),
			{params: Promise.resolve({uuid})}
		);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.uuid).toBe(uuid);
	});

	it('returns 404 DONATION_NOT_FOUND for missing uuid', async () => {
		const res = await singleGet(
			new NextRequest('http://localhost/api/donations/ghost'),
			{params: Promise.resolve({uuid: 'ghost'})}
		);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error.code).toBe('DONATION_NOT_FOUND');
	});
});
