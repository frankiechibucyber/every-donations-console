import {getRepository} from '@/server/container';
import {ClientRoot} from '@/ui/client-root';

// Dashboard reads from the module-level repository singleton at request time.
// Must be dynamic so each request reflects the current in-memory state.
export const dynamic = 'force-dynamic';

export default function Home() {
	const {donations} = getRepository().list();
	return <ClientRoot initial={donations} />;
}
