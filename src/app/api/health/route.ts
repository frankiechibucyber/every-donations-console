// Liveness / readiness probe for Docker, k8s, or any orchestrator.
// Intentionally tiny: returns fast, does no I/O, never 5xx.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
	return Response.json({ok: true, at: new Date().toISOString()});
}
