import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
	// Produces a slim production bundle at .next/standalone containing only
	// the files the server needs at runtime. Lets the Docker image drop the
	// dev dependencies entirely, cutting the runtime image by ~3x.
	output: 'standalone'
};

export default nextConfig;
