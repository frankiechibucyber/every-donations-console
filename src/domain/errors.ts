import type {Donation, DonationStatus} from './types';

export type ErrorCode =
	| 'INVALID_PAYLOAD'
	| 'DONATION_NOT_FOUND'
	| 'DUPLICATE_UUID'
	| 'NO_OP'
	| 'INVALID_TRANSITION';

export abstract class DomainError extends Error {
	abstract readonly code: ErrorCode;
	abstract readonly status: number;
}

export class ValidationError extends DomainError {
	readonly code = 'INVALID_PAYLOAD';
	readonly status = 400;
	constructor(
		message: string,
		readonly details?: unknown
	) {
		super(message);
	}
}

export class NotFoundError extends DomainError {
	readonly code = 'DONATION_NOT_FOUND';
	readonly status = 404;
	constructor(readonly uuid: string) {
		super(`No donation with uuid ${uuid}`);
	}
}

export class DuplicateUuidError extends DomainError {
	readonly code = 'DUPLICATE_UUID';
	readonly status = 409;
	constructor(
		readonly uuid: string,
		readonly existing: Donation
	) {
		super(`A donation with uuid ${uuid} already exists`);
	}
}

export class SameStatusError extends DomainError {
	readonly code = 'NO_OP';
	readonly status = 409;
	constructor(readonly status_: DonationStatus) {
		super(`Donation is already in status ${status_}`);
	}
}

export class InvalidTransitionError extends DomainError {
	readonly code = 'INVALID_TRANSITION';
	readonly status = 422;
	constructor(
		readonly from: DonationStatus,
		readonly to: DonationStatus,
		readonly allowedFromHere: readonly DonationStatus[]
	) {
		super(`Cannot transition from ${from} to ${to}`);
	}
}
