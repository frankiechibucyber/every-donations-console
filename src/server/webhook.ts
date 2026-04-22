import {randomUUID} from 'node:crypto';
import type {Donation, DonationStatus} from '@/domain/types';

// Matches every.org's public webhook envelope style: typed top-level with
// `data` carrying the resource. Production delivery would use an outbox
// table and a worker with retries plus DLQ; we emit to stdout here.
export function emitDonationEvent(donation: Donation): void {
	const type = eventType(donation.status);
	if (!type) return;

	const envelope = {
		id: `evt_${randomUUID()}`,
		type,
		occurredAt: new Date().toISOString(),
		data: donation
	};

	console.info(`[webhook] ${JSON.stringify(envelope)}`);
}

function eventType(
	status: DonationStatus
): 'donation.succeeded' | 'donation.failed' | null {
	if (status === 'success') return 'donation.succeeded';
	if (status === 'failure') return 'donation.failed';
	return null;
}
