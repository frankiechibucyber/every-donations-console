// Spec-provided types. The Donation interface here extends the spec's by
// one field: `transitions`, a lightweight in-record ledger of status changes.
// Everything else matches the assessment's TypeScript interfaces verbatim.

export type PaymentMethod = 'cc' | 'ach' | 'crypto' | 'venmo';

export type DonationStatus = 'new' | 'pending' | 'success' | 'failure';

export type Currency = 'USD';

export interface StatusTransition {
	from: DonationStatus;
	to: DonationStatus;
	at: string;
}

export interface Donation {
	uuid: string;
	amount: number;
	currency: Currency;
	paymentMethod: PaymentMethod;
	nonprofitId: string;
	donorId: string;
	status: DonationStatus;
	createdAt: string;
	updatedAt: string;
	transitions: StatusTransition[];
}

export interface CreateDonationInput {
	uuid: string;
	amount: number;
	currency: Currency;
	paymentMethod: PaymentMethod;
	nonprofitId: string;
	donorId: string;
	status: DonationStatus;
	createdAt: string;
}
