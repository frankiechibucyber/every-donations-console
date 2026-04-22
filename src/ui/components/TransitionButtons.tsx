'use client';

import type {DonationStatus} from '@/domain/types';
import {allowedTransitions} from '@/domain/transitions';

interface Props {
	uuid: string;
	currentStatus: DonationStatus;
	disabled: boolean;
	onTransition: (uuid: string, next: DonationStatus) => void;
}

const BUTTON_STYLES: Record<DonationStatus, string> = {
	new: 'bg-slate-600 hover:bg-slate-700 text-white',
	pending: 'bg-amber-600 hover:bg-amber-700 text-white',
	success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
	failure: 'bg-rose-600 hover:bg-rose-700 text-white'
};

// Terminal rows render nothing by construction. The spec requirement
// "a success donation has no further actions" is satisfied here, and
// by the empty array the TRANSITIONS constant returns for terminals.
export function TransitionButtons({
	uuid,
	currentStatus,
	disabled,
	onTransition
}: Props) {
	const nextOptions = allowedTransitions(currentStatus);
	if (nextOptions.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1.5">
			{nextOptions.map((next) => (
				<button
					key={next}
					type="button"
					disabled={disabled}
					onClick={() => onTransition(uuid, next)}
					className={`rounded px-2 py-1 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_STYLES[next]}`}
				>
					Mark {next}
				</button>
			))}
		</div>
	);
}
