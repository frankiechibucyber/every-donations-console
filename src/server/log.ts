interface LogFields {
	level: 'info' | 'warn' | 'error';
	route: string;
	outcome: string;
	uuid?: string;
	from?: string;
	to?: string;
	durationMs?: number;
}

// Structured JSON on stdout. Forward-compatible with pino or any shipper.
export function logRequest(fields: LogFields): void {
	const payload = {at: new Date().toISOString(), ...fields};
	const fn = fields.level === 'error' ? console.error : console.info;
	fn(JSON.stringify(payload));
}
