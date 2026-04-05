import type { NextConfig } from 'next';

const catalogApiUrlForClient =
	process.env.NEXT_PUBLIC_CATALOG_API_URL?.trim() ||
	process.env.CATALOG_API_URL?.trim() ||
	process.env.INTERNAL_CATALOG_API_URL?.trim() ||
	'';

const nextConfig: NextConfig = {
	...(catalogApiUrlForClient
		? { env: { NEXT_PUBLIC_CATALOG_API_URL: catalogApiUrlForClient } }
		: {}),
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'crm.newtrend.team',
				pathname: '/media/**',
			},
		],
	},
};

export default nextConfig;
