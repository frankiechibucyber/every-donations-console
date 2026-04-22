import {NextRequest} from 'next/server';
import {NotFoundError} from '@/domain/errors';
import {getRepository} from '@/server/container';
import {mapError} from '@/server/errorMap';
import {logRequest} from '@/server/log';

export const dynamic = 'force-dynamic';

export async function GET(
	_request: NextRequest,
	{params}: {params: Promise<{uuid: string}>}
): Promise<Response> {
	const started = performance.now();
	const {uuid} = await params;

	try {
		const donation = getRepository().findByUuid(uuid);
		if (!donation) throw new NotFoundError(uuid);

		logRequest({
			level: 'info',
			route: 'GET /donations/:uuid',
			outcome: 'found',
			uuid,
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(donation);
	} catch (err) {
		const mapped = mapError(err);
		logRequest({
			level: 'warn',
			route: 'GET /donations/:uuid',
			outcome: mapped.body.error.code.toLowerCase(),
			uuid,
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(mapped.body, {status: mapped.status});
	}
}
