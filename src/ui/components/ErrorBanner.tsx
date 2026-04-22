'use client';

export interface ApiErrorShape {
	code: string;
	message: string;
	details?: unknown;
}

interface Props {
	error: ApiErrorShape | null;
	onDismiss: () => void;
}

export function ErrorBanner({error, onDismiss}: Props) {
	if (!error) return null;

	return (
		<div
			role="alert"
			className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm"
		>
			<div className="flex-1">
				<p className="font-medium text-rose-800">{error.message}</p>
				<p className="mt-0.5 text-xs text-rose-600">code: {error.code}</p>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				aria-label="Dismiss"
				className="text-rose-600 hover:text-rose-800"
			>
				×
			</button>
		</div>
	);
}
