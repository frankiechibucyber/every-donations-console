import type {DonationStatus} from './types';

// The entire state machine lives here. Both the API validator and the UI
// button renderer import from this file. There is no other source of truth.
export const TRANSITIONS = {
	new: ['pending'],
	pending: ['success', 'failure'],
	success: [],
	failure: []
} as const satisfies Record<DonationStatus, readonly DonationStatus[]>;

export function allowedTransitions(
	from: DonationStatus
): readonly DonationStatus[] {
	return TRANSITIONS[from];
}

export function isValidTransition(
	from: DonationStatus,
	to: DonationStatus
): boolean {
	return (TRANSITIONS[from] as readonly DonationStatus[]).includes(to);
}

export function isTerminal(status: DonationStatus): boolean {
	return TRANSITIONS[status].length === 0;
}
