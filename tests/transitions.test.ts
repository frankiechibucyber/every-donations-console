import {describe, expect, it} from 'vitest';
import {
	allowedTransitions,
	isTerminal,
	isValidTransition
} from '@/domain/transitions';
import type {DonationStatus} from '@/domain/types';

const ALL: DonationStatus[] = ['new', 'pending', 'success', 'failure'];

const EXPECTED_VALID = new Set([
	'new->pending',
	'pending->success',
	'pending->failure'
]);

describe('TRANSITIONS state machine', () => {
	it.each(
		ALL.flatMap((from) =>
			ALL.map((to) => ({
				from,
				to,
				valid: EXPECTED_VALID.has(`${from}->${to}`)
			}))
		)
	)('$from -> $to is $valid', ({from, to, valid}) => {
		expect(isValidTransition(from, to)).toBe(valid);
	});

	it('allowedTransitions returns exact lists', () => {
		expect(allowedTransitions('new')).toEqual(['pending']);
		expect(allowedTransitions('pending')).toEqual(['success', 'failure']);
		expect(allowedTransitions('success')).toEqual([]);
		expect(allowedTransitions('failure')).toEqual([]);
	});

	it('isTerminal identifies success and failure as terminal', () => {
		expect(isTerminal('success')).toBe(true);
		expect(isTerminal('failure')).toBe(true);
		expect(isTerminal('new')).toBe(false);
		expect(isTerminal('pending')).toBe(false);
	});
});
