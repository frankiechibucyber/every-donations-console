'use client';

import {useState} from 'react';
import type {Donation, DonationStatus} from '@/domain/types';
import {StatusBadge} from './StatusBadge';
import {TransitionButtons} from './TransitionButtons';
import {TransitionsTimeline} from './TransitionsTimeline';
import {
	formatDollars,
	formatPaymentMethod,
	formatRelativeTime,
	truncateUuid
} from '../format';

interface Props {
	donations: readonly Donation[];
	pendingUuids: ReadonlySet<string>;
	onTransition: (uuid: string, next: DonationStatus) => void;
}

export function DonationsTable({donations, pendingUuids, onTransition}: Props) {
	const [expanded, setExpanded] = useState<string | null>(null);

	if (donations.length === 0) {
		return (
			<div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
				No donations match the current filters.
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border border-slate-200 bg-white">
			<table className="w-full divide-y divide-slate-200 text-left text-sm">
				<thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
					<tr>
						<th className="px-3 py-2">UUID</th>
						<th className="px-3 py-2">Status</th>
						<th className="px-3 py-2 text-right">Amount</th>
						<th className="px-3 py-2">Method</th>
						<th className="px-3 py-2">Nonprofit</th>
						<th className="px-3 py-2">Donor</th>
						<th className="px-3 py-2">Created</th>
						<th className="px-3 py-2">Actions</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{donations.map((d) => {
						const isExpanded = expanded === d.uuid;
						const isPending = pendingUuids.has(d.uuid);
						return (
							<RowFragment
								key={d.uuid}
								donation={d}
								isExpanded={isExpanded}
								isPending={isPending}
								onToggle={() =>
									setExpanded(isExpanded ? null : d.uuid)
								}
								onTransition={onTransition}
							/>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function RowFragment({
	donation,
	isExpanded,
	isPending,
	onToggle,
	onTransition
}: {
	donation: Donation;
	isExpanded: boolean;
	isPending: boolean;
	onToggle: () => void;
	onTransition: (uuid: string, next: DonationStatus) => void;
}) {
	return (
		<>
			<tr className="hover:bg-slate-50">
				<td className="px-3 py-2 font-mono text-xs">
					<button
						type="button"
						onClick={onToggle}
						className="flex items-center gap-1 text-slate-700 hover:text-slate-900"
						title="Click to view transitions timeline"
					>
						<span aria-hidden>{isExpanded ? '▾' : '▸'}</span>
						<span>{truncateUuid(donation.uuid)}</span>
					</button>
				</td>
				<td className="px-3 py-2">
					<StatusBadge status={donation.status} />
				</td>
				<td className="px-3 py-2 text-right font-medium">
					{formatDollars(donation.amount)}
				</td>
				<td className="px-3 py-2">
					{formatPaymentMethod(donation.paymentMethod)}
				</td>
				<td className="px-3 py-2">{donation.nonprofitId}</td>
				<td className="px-3 py-2">{donation.donorId}</td>
				<td
					className="px-3 py-2 text-slate-500"
					title={donation.createdAt}
				>
					{formatRelativeTime(donation.createdAt)}
				</td>
				<td className="px-3 py-2">
					<TransitionButtons
						uuid={donation.uuid}
						currentStatus={donation.status}
						disabled={isPending}
						onTransition={onTransition}
					/>
				</td>
			</tr>
			{isExpanded && (
				<tr className="bg-slate-50">
					<td colSpan={8} className="px-6 py-3">
						<p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
							Transition history
						</p>
						<TransitionsTimeline transitions={donation.transitions} />
					</td>
				</tr>
			)}
		</>
	);
}
