import {z} from 'zod';

const PAYMENT_METHODS = ['cc', 'ach', 'crypto', 'venmo'] as const;
const STATUSES = ['new', 'pending', 'success', 'failure'] as const;

// The sample data's UUIDs are not RFC 4122 (version bits are zeros). Using
// z.string().uuid() would reject the seed data. Permissive non-empty string
// matches the spec's seed data exactly. Documented in README.
export const createDonationSchema = z
	.object({
		uuid: z.string().min(1, 'uuid must be a non-empty string'),
		amount: z
			.number()
			.int('amount must be an integer number of cents')
			.min(1, 'amount must be at least 1 cent')
			.max(10_000_000, 'amount exceeds the $100,000 per-donation guardrail'),
		currency: z.literal('USD'),
		paymentMethod: z.enum(PAYMENT_METHODS),
		nonprofitId: z.string().min(1),
		donorId: z.string().min(1),
		status: z.enum(STATUSES),
		createdAt: z.string().datetime({offset: true})
	})
	.strip();

export const patchStatusSchema = z
	.object({
		status: z.enum(STATUSES)
	})
	.strip();

export const listQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(1000).optional(),
	cursor: z.string().optional()
});

export type CreateDonationBody = z.infer<typeof createDonationSchema>;
export type PatchStatusBody = z.infer<typeof patchStatusSchema>;
