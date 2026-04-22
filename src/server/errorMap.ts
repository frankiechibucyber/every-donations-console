import {z} from 'zod';
import {
	DomainError,
	DuplicateUuidError,
	InvalidTransitionError,
	ValidationError
} from '@/domain/errors';

interface ErrorBody {
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

function body(
	code: string,
	message: string,
	details?: unknown
): ErrorBody {
	return {error: {code, message, ...(details === undefined ? {} : {details})}};
}

export function mapError(err: unknown): {status: number; body: ErrorBody} {
	if (err instanceof z.ZodError) {
		return {
			status: 400,
			body: body(
				'INVALID_PAYLOAD',
				'Request body failed validation',
				err.issues.map((issue) => ({
					path: issue.path.join('.'),
					message: issue.message
				}))
			)
		};
	}

	if (err instanceof ValidationError) {
		return {
			status: 400,
			body: body(err.code, err.message, err.details)
		};
	}

	if (err instanceof DuplicateUuidError) {
		return {
			status: err.status,
			body: body(err.code, err.message, {existing: err.existing})
		};
	}

	if (err instanceof InvalidTransitionError) {
		return {
			status: err.status,
			body: body(err.code, err.message, {
				from: err.from,
				to: err.to,
				allowedFromHere: err.allowedFromHere
			})
		};
	}

	if (err instanceof DomainError) {
		return {status: err.status, body: body(err.code, err.message)};
	}

	const message = err instanceof Error ? err.message : 'Unknown error';
	return {
		status: 500,
		body: body('INTERNAL_ERROR', message)
	};
}
