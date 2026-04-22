const dollarFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD'
});

export function formatDollars(cents: number): string {
	return dollarFormatter.format(cents / 100);
}

export function truncateUuid(uuid: string, chars = 8): string {
	return uuid.length <= chars ? uuid : `${uuid.slice(0, chars)}…`;
}

const PAYMENT_LABELS: Record<string, string> = {
	cc: 'Card',
	ach: 'ACH',
	crypto: 'Crypto',
	venmo: 'Venmo'
};

export function formatPaymentMethod(method: string): string {
	return PAYMENT_LABELS[method] ?? method;
}

export function formatRelativeTime(iso: string): string {
	const diffMs = Date.now() - new Date(iso).getTime();
	const seconds = Math.floor(diffMs / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}
