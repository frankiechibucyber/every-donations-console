import {InMemoryDonationRepository} from '@/data/repository';
import type {DonationRepository} from '@/data/repository';
import {SEED_DONATIONS} from '@/data/seed';

let repository: DonationRepository | null = null;

function build(): DonationRepository {
	const repo = new InMemoryDonationRepository();
	for (const seed of SEED_DONATIONS) {
		repo.create(seed);
	}

	return repo;
}

export function getRepository(): DonationRepository {
	if (!repository) {
		repository = build();
	}

	return repository;
}

// Used by Vitest's beforeEach to give every test a fresh, re-seeded repository.
export function resetRepositoryForTests(): void {
	repository = build();
}
