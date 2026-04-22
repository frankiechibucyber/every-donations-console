'use client';

import {useReducer, useState, useMemo} from 'react';
import type {Donation, DonationStatus, PaymentMethod} from '@/domain/types';
import {DonationsTable} from './components/DonationsTable';
import {ErrorBanner} from './components/ErrorBanner';
import type {ApiErrorShape} from './components/ErrorBanner';
import {FilterBar} from './components/FilterBar';
import type {StatusFilter} from './components/FilterBar';
import {SummaryTiles} from './components/SummaryTiles';

interface State {
	donations: Donation[];
	statusFilter: StatusFilter;
	methodFilter: PaymentMethod | 'all';
	error: ApiErrorShape | null;
}

type Action =
	| {type: 'HYDRATE'; donations: Donation[]}
	| {type: 'REPLACE'; donation: Donation}
	| {type: 'STATUS_FILTER'; value: StatusFilter}
	| {type: 'METHOD_FILTER'; value: PaymentMethod | 'all'}
	| {type: 'ERROR'; value: ApiErrorShape | null};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case 'HYDRATE':
			return {...state, donations: action.donations};
		case 'REPLACE':
			return {
				...state,
				donations: state.donations.map((d) =>
					d.uuid === action.donation.uuid ? action.donation : d
				)
			};
		case 'STATUS_FILTER':
			return {...state, statusFilter: action.value};
		case 'METHOD_FILTER':
			return {...state, methodFilter: action.value};
		case 'ERROR':
			return {...state, error: action.value};
	}
}

function passesStatus(status: DonationStatus, filter: StatusFilter): boolean {
	if (filter === 'all') return true;
	if (filter === 'needs-action') return status === 'new' || status === 'pending';
	return status === filter;
}

export function ClientRoot({initial}: {initial: Donation[]}) {
	const [state, dispatch] = useReducer(reducer, {
		donations: initial,
		// The default landing view is the work queue, not "all". Operators open
		// this tool to do work; "all" is one click away.
		statusFilter: 'needs-action',
		methodFilter: 'all',
		error: null
	});
	const [pendingUuids, setPendingUuids] = useState<Set<string>>(new Set());
	const [refreshing, setRefreshing] = useState(false);

	const visible = useMemo(
		() =>
			state.donations.filter(
				(d) =>
					passesStatus(d.status, state.statusFilter) &&
					(state.methodFilter === 'all' ||
						d.paymentMethod === state.methodFilter)
			),
		[state.donations, state.statusFilter, state.methodFilter]
	);

	async function transition(uuid: string, next: DonationStatus) {
		setPendingUuids((prev) => new Set(prev).add(uuid));
		dispatch({type: 'ERROR', value: null});
		try {
			const res = await fetch(`/api/donations/${uuid}/status`, {
				method: 'PATCH',
				headers: {'content-type': 'application/json'},
				body: JSON.stringify({status: next})
			});
			const body = await res.json();
			if (!res.ok) {
				dispatch({type: 'ERROR', value: body.error});
				return;
			}

			dispatch({type: 'REPLACE', donation: body});
		} catch (err) {
			dispatch({
				type: 'ERROR',
				value: {
					code: 'NETWORK_ERROR',
					message:
						err instanceof Error ? err.message : 'Network request failed'
				}
			});
		} finally {
			setPendingUuids((prev) => {
				const copy = new Set(prev);
				copy.delete(uuid);
				return copy;
			});
		}
	}

	async function refresh() {
		setRefreshing(true);
		dispatch({type: 'ERROR', value: null});
		try {
			const res = await fetch('/api/donations');
			const body = await res.json();
			if (!res.ok) {
				dispatch({type: 'ERROR', value: body.error});
				return;
			}

			dispatch({type: 'HYDRATE', donations: body.donations});
		} catch (err) {
			dispatch({
				type: 'ERROR',
				value: {
					code: 'NETWORK_ERROR',
					message:
						err instanceof Error ? err.message : 'Network request failed'
				}
			});
		} finally {
			setRefreshing(false);
		}
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
			<header className="flex items-baseline justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">
						Donation Processor
					</h1>
					<p className="text-sm text-slate-500">
						Internal tool for manually processing donations.
					</p>
				</div>
				<span className="text-xs text-slate-400">
					{state.donations.length} total · {visible.length} visible
				</span>
			</header>

			<SummaryTiles donations={visible} />

			<ErrorBanner
				error={state.error}
				onDismiss={() => dispatch({type: 'ERROR', value: null})}
			/>

			<FilterBar
				status={state.statusFilter}
				paymentMethod={state.methodFilter}
				onStatus={(value) => dispatch({type: 'STATUS_FILTER', value})}
				onPaymentMethod={(value) =>
					dispatch({type: 'METHOD_FILTER', value})
				}
				onRefresh={refresh}
				refreshing={refreshing}
			/>

			<DonationsTable
				donations={visible}
				pendingUuids={pendingUuids}
				onTransition={transition}
			/>
		</div>
	);
}
