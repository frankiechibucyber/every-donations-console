'use client';

import type {PaymentMethod} from '@/domain/types';

export type StatusFilter = 'needs-action' | 'all' | 'success' | 'failure';

const STATUS_OPTIONS: {value: StatusFilter; label: string}[] = [
	{value: 'needs-action', label: 'Needs action'},
	{value: 'all', label: 'All'},
	{value: 'success', label: 'Success'},
	{value: 'failure', label: 'Failure'}
];

const METHOD_OPTIONS: {value: PaymentMethod | 'all'; label: string}[] = [
	{value: 'all', label: 'All methods'},
	{value: 'cc', label: 'Card'},
	{value: 'ach', label: 'ACH'},
	{value: 'crypto', label: 'Crypto'},
	{value: 'venmo', label: 'Venmo'}
];

interface Props {
	status: StatusFilter;
	paymentMethod: PaymentMethod | 'all';
	onStatus: (s: StatusFilter) => void;
	onPaymentMethod: (m: PaymentMethod | 'all') => void;
	onRefresh: () => void;
	refreshing: boolean;
}

export function FilterBar({
	status,
	paymentMethod,
	onStatus,
	onPaymentMethod,
	onRefresh,
	refreshing
}: Props) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<div
				className="inline-flex rounded-md border border-slate-200 bg-white p-0.5"
				role="group"
				aria-label="Status filter"
			>
				{STATUS_OPTIONS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onStatus(opt.value)}
						className={`rounded px-3 py-1.5 text-xs font-medium transition ${
							status === opt.value
								? 'bg-slate-900 text-white'
								: 'text-slate-600 hover:bg-slate-100'
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			<select
				value={paymentMethod}
				onChange={(e) =>
					onPaymentMethod(e.target.value as PaymentMethod | 'all')
				}
				className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
			>
				{METHOD_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			<button
				type="button"
				onClick={onRefresh}
				disabled={refreshing}
				className="ml-auto rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
			>
				{refreshing ? 'Refreshing…' : 'Refresh'}
			</button>
		</div>
	);
}
