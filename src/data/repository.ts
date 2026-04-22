import type {CreateDonationInput, Donation, DonationStatus} from '@/domain/types';
import {
	DuplicateUuidError,
	InvalidTransitionError,
	NotFoundError,
	SameStatusError
} from '@/domain/errors';
import {allowedTransitions, isValidTransition} from '@/domain/transitions';

export interface ListOptions {
	limit?: number;
	cursor?: {createdAt: string; uuid: string};
}

export interface ListResult {
	donations: Donation[];
	nextCursor?: {createdAt: string; uuid: string};
}

export interface DonationRepository {
	list(options?: ListOptions): ListResult;
	findByUuid(uuid: string): Donation | null;
	create(input: CreateDonationInput): Donation;
	updateStatus(uuid: string, next: DonationStatus): Donation;
}

// Reads always return structured clones so callers cannot mutate internal
// state. This costs almost nothing at this data size and forecloses a whole
// class of accidental-mutation bugs.
function clone<T>(value: T): T {
	return structuredClone(value);
}

function compareDonations(a: Donation, b: Donation): number {
	if (a.createdAt === b.createdAt) {
		return a.uuid < b.uuid ? 1 : -1;
	}

	return a.createdAt < b.createdAt ? 1 : -1;
}

export class InMemoryDonationRepository implements DonationRepository {
	private readonly store = new Map<string, Donation>();

	list(options: ListOptions = {}): ListResult {
		const sorted = Array.from(this.store.values()).sort(compareDonations);
		const start = options.cursor
			? sorted.findIndex(
					(d) =>
						d.createdAt < options.cursor!.createdAt ||
						(d.createdAt === options.cursor!.createdAt &&
							d.uuid < options.cursor!.uuid)
				)
			: 0;
		const effectiveStart = start === -1 ? sorted.length : start;

		if (options.limit === undefined) {
			return {donations: clone(sorted.slice(effectiveStart))};
		}

		const page = sorted.slice(effectiveStart, effectiveStart + options.limit);
		const more = sorted.length > effectiveStart + options.limit;
		const last = page[page.length - 1];

		return {
			donations: clone(page),
			...(more && last
				? {nextCursor: {createdAt: last.createdAt, uuid: last.uuid}}
				: {})
		};
	}

	findByUuid(uuid: string): Donation | null {
		const hit = this.store.get(uuid);
		return hit ? clone(hit) : null;
	}

	create(input: CreateDonationInput): Donation {
		const existing = this.store.get(input.uuid);
		if (existing) {
			throw new DuplicateUuidError(input.uuid, clone(existing));
		}

		const donation: Donation = {
			...input,
			updatedAt: input.createdAt,
			transitions: []
		};
		this.store.set(input.uuid, donation);
		return clone(donation);
	}

	updateStatus(uuid: string, next: DonationStatus): Donation {
		const current = this.store.get(uuid);
		if (!current) {
			throw new NotFoundError(uuid);
		}

		if (current.status === next) {
			throw new SameStatusError(next);
		}

		if (!isValidTransition(current.status, next)) {
			throw new InvalidTransitionError(
				current.status,
				next,
				allowedTransitions(current.status)
			);
		}

		const now = new Date().toISOString();
		const updated: Donation = {
			...current,
			status: next,
			updatedAt: now,
			transitions: [
				...current.transitions,
				{from: current.status, to: next, at: now}
			]
		};
		this.store.set(uuid, updated);
		return clone(updated);
	}
}
