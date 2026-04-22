import type {DonationStatus} from '@/domain/types';

const STYLES: Record<DonationStatus, string> = {
	new: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
	pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
	success: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
	failure: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'
};

export function StatusBadge({status}: {status: DonationStatus}) {
	return (
		<span
			className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
		>
			{status}
		</span>
	);
}
