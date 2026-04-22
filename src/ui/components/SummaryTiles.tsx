'use client';

import {useState} from 'react';
import type {Donation} from '@/domain/types';
import {formatDollars} from '../format';

interface Props {
	donations: readonly Donation[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function SummaryTiles({donations}: Props) {
	// Stable snapshot of "now" captured once at mount. Keeps React 19's
	// purity checks happy and means the 7-day window doesn't drift across
	// renders of the same session.
	const [cutoff] = useState(() => Date.now() - SEVEN_DAYS_MS);

	const needsAction = donations.filter(
		(d) => d.status === 'new' || d.status === 'pending'
	).length;

	const successTotal = donations
		.filter((d) => d.status === 'success')
		.reduce((sum, d) => sum + d.amount, 0);

	const recentTerminal = donations.flatMap((d) =>
		d.transitions.filter(
			(t) =>
				(t.to === 'success' || t.to === 'failure') &&
				new Date(t.at).getTime() >= cutoff
		)
	);
	const failures = recentTerminal.filter((t) => t.to === 'failure').length;
	const failureRate =
		recentTerminal.length === 0
			? '—'
			: `${Math.round((failures / recentTerminal.length) * 100)}%`;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<Tile
				label="Needs action"
				value={String(needsAction)}
				hint="new + pending"
			/>
			<Tile
				label="Successfully processed"
				value={formatDollars(successTotal)}
				hint="lifetime in success"
			/>
			<Tile
				label="Failure rate (7d)"
				value={failureRate}
				hint={`${failures} / ${recentTerminal.length} terminal`}
			/>
		</div>
	);
}

function Tile({
	label,
	value,
	hint
}: {
	label: string;
	value: string;
	hint: string;
}) {
	return (
		<div className="rounded-lg border border-slate-200 bg-white p-4">
			<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
				{label}
			</p>
			<p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
			<p className="mt-1 text-xs text-slate-400">{hint}</p>
		</div>
	);
}
