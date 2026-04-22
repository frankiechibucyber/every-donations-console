import {NextRequest} from 'next/server';
import {ValidationError} from '@/domain/errors';
import {isTerminal} from '@/domain/transitions';
import {getRepository} from '@/server/container';
import {mapError} from '@/server/errorMap';
import {patchStatusSchema} from '@/server/schemas';
import {emitDonationEvent} from '@/server/webhook';
import {logRequest} from '@/server/log';

export const dynamic = 'force-dynamic';

export async function PATCH(
	request: NextRequest,
	{params}: {params: Promise<{uuid: string}>}
): Promise<Response> {
	const started = performance.now();
	const {uuid} = await params;
	let fromStatus: string | undefined;
	let toStatus: string | undefined;

	try {
		const raw = await request.json().catch(() => {
			throw new ValidationError('Request body is not valid JSON');
		});
		const {status} = patchStatusSchema.parse(raw);
		toStatus = status;

		const repo = getRepository();
		const before = repo.findByUuid(uuid);
		fromStatus = before?.status;

		const updated = repo.updateStatus(uuid, status);
		if (isTerminal(updated.status)) {
			emitDonationEvent(updated);
		}

		logRequest({
			level: 'info',
			route: 'PATCH /donations/:uuid/status',
			outcome: 'updated',
			uuid,
			...(fromStatus ? {from: fromStatus} : {}),
			to: toStatus,
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(updated);
	} catch (err) {
		const mapped = mapError(err);
		logRequest({
			level: 'warn',
			route: 'PATCH /donations/:uuid/status',
			outcome: mapped.body.error.code.toLowerCase(),
			uuid,
			...(fromStatus ? {from: fromStatus} : {}),
			...(toStatus ? {to: toStatus} : {}),
			durationMs: Math.round(performance.now() - started)
		});
		return Response.json(mapped.body, {status: mapped.status});
	}
}
