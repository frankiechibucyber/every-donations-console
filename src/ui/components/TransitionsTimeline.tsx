import type {StatusTransition} from '@/domain/types';
import {StatusBadge} from './StatusBadge';

export function TransitionsTimeline({
	transitions
}: {
	transitions: StatusTransition[];
}) {
	if (transitions.length === 0) {
		return (
			<p className="text-xs text-slate-500">
				No transitions yet. The donation is at its original status.
			</p>
		);
	}

	return (
		<ol className="space-y-2">
			{transitions.map((t, i) => (
				<li
					key={`${t.at}-${i}`}
					className="flex items-center gap-2 text-xs text-slate-600"
				>
					<StatusBadge status={t.from} />
					<span>→</span>
					<StatusBadge status={t.to} />
					<span className="text-slate-400">
						{new Date(t.at).toLocaleString()}
					</span>
				</li>
			))}
		</ol>
	);
}
