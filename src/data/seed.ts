import type {CreateDonationInput} from '@/domain/types';

// The eight donations the spec asks us to seed. Values copied verbatim.
export const SEED_DONATIONS: readonly CreateDonationInput[] = [
	{
		uuid: 'a1b2c3d4-0001-0001-0001-000000000001',
		amount: 5000,
		currency: 'USD',
		paymentMethod: 'cc',
		nonprofitId: 'org1',
		donorId: 'donor_01',
		status: 'new',
		createdAt: '2026-01-15T10:00:00Z'
	},
	{
		uuid: 'a1b2c3d4-0002-0002-0002-000000000002',
		amount: 10000,
		currency: 'USD',
		paymentMethod: 'ach',
		nonprofitId: 'org2',
		donorId: 'donor_02',
		status: 'new',
		createdAt: '2026-01-15T10:05:00Z'
	},
	{
		uuid: 'a1b2c3d4-0003-0003-0003-000000000003',
		amount: 25000,
		currency: 'USD',
		paymentMethod: 'crypto',
		nonprofitId: 'org1',
		donorId: 'donor_03',
		status: 'pending',
		createdAt: '2026-01-15T10:10:00Z'
	},
	{
		uuid: 'a1b2c3d4-0004-0004-0004-000000000004',
		amount: 1500,
		currency: 'USD',
		paymentMethod: 'venmo',
		nonprofitId: 'org3',
		donorId: 'donor_04',
		status: 'pending',
		createdAt: '2026-01-15T10:15:00Z'
	},
	{
		uuid: 'a1b2c3d4-0005-0005-0005-000000000005',
		amount: 7500,
		currency: 'USD',
		paymentMethod: 'cc',
		nonprofitId: 'org2',
		donorId: 'donor_05',
		status: 'success',
		createdAt: '2026-01-15T10:20:00Z'
	},
	{
		uuid: 'a1b2c3d4-0006-0006-0006-000000000006',
		amount: 3000,
		currency: 'USD',
		paymentMethod: 'ach',
		nonprofitId: 'org3',
		donorId: 'donor_06',
		status: 'failure',
		createdAt: '2026-01-15T10:25:00Z'
	},
	{
		uuid: 'a1b2c3d4-0007-0007-0007-000000000007',
		amount: 15000,
		currency: 'USD',
		paymentMethod: 'crypto',
		nonprofitId: 'org1',
		donorId: 'donor_07',
		status: 'new',
		createdAt: '2026-01-15T10:30:00Z'
	},
	{
		uuid: 'a1b2c3d4-0008-0008-0008-000000000008',
		amount: 20000,
		currency: 'USD',
		paymentMethod: 'venmo',
		nonprofitId: 'org2',
		donorId: 'donor_08',
		status: 'pending',
		createdAt: '2026-01-15T10:35:00Z'
	}
];
