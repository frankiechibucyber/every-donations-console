import {NextRequest} from 'next/server';
import {getRepository} from '@/server/container';
import {createDonationSchema, listQuerySchema} from '@/server/schemas';
import {mapError} from '@/server/errorMap';
import {ValidationError} from '@/domain/errors';
import {logRequest} from '@/server/log';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<Response> {
	const started = performance.now();
	let uuid: string | undefined;

	try {
		const raw = await request.json().catch(() => {
			throw new ValidationError('Request body is not valid JSON');
		});
		const input = createDonationSchema.parse(raw);
		uuid = input.uuid;

		const donation = getRepository().create(input);
		logRequest({
			level: 'info',
			route: 'POST /donations',
			outcome: 'created',
			uuid: donation.uuid,
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(donation, {status: 201});
	} catch (err) {
		const mapped = mapError(err);
		logRequest({
			level: mapped.status >= 500 ? 'error' : 'warn',
			route: 'POST /donations',
			outcome: mapped.body.error.code.toLowerCase(),
			...(uuid ? {uuid} : {}),
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(mapped.body, {status: mapped.status});
	}
}

export async function GET(request: NextRequest): Promise<Response> {
	const started = performance.now();

	try {
		const url = new URL(request.url);
		const query = listQuerySchema.parse({
			limit: url.searchParams.get('limit') ?? undefined,
			cursor: url.searchParams.get('cursor') ?? undefined
		});

		const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
		const result = getRepository().list({
			...(query.limit === undefined ? {} : {limit: query.limit}),
			...(cursor ? {cursor} : {})
		});

		logRequest({
			level: 'info',
			route: 'GET /donations',
			outcome: 'listed',
			durationMs: Math.round(performance.now() - started)
		});

		return Response.json({
			donations: result.donations,
			...(result.nextCursor
				? {nextCursor: encodeCursor(result.nextCursor)}
				: {})
		});
	} catch (err) {
		const mapped = mapError(err);
		logRequest({
			level: 'warn',
			route: 'GET /donations',
			outcome: mapped.body.error.code.toLowerCase(),
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(mapped.body, {status: mapped.status});
	}
}

function encodeCursor(value: {createdAt: string; uuid: string}): string {
	return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeCursor(value: string): {createdAt: string; uuid: string} {
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64url').toString());
		if (
			typeof parsed?.createdAt !== 'string' ||
			typeof parsed?.uuid !== 'string'
		) {
			throw new Error('bad shape');
		}

		return parsed;
	} catch {
		throw new ValidationError('Invalid cursor');
	}
}
