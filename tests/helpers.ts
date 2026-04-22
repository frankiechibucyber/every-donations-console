import {NextRequest} from 'next/server';

export function jsonRequest(
	url: string,
	init: {method: string; body?: unknown}
): NextRequest {
	return new NextRequest(url, {
		method: init.method,
		headers: {'content-type': 'application/json'},
		...(init.body === undefined
			? {}
			: {body: JSON.stringify(init.body)})
	});
}
