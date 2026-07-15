import {pathToFileURL} from 'node:url';

export const canaryRepository = 'jonahsnider/renovate-config';

const request = async ({baseUrl, token, fetchImpl}, path, options = {}) => {
	const response = await fetchImpl(new URL(path, `${baseUrl.replace(/\/$/, '')}/`), {
		...options,
		headers: {
			accept: 'application/json',
			authorization: `Bearer ${token}`,
			...options.headers,
		},
	});

	const body = await response.json().catch(() => undefined);

	if (!response.ok) {
		const message = body?.message ?? body?.reason ?? response.statusText;
		throw new Error(`${options.method ?? 'GET'} ${path} failed (${response.status}): ${message}`);
	}

	return body;
};

export const listRepositories = async client => {
	const repositories = await request(client, '/api/v1/orgs/jonahsnider/-/repos?state=installed&limit=10000');

	if (!Array.isArray(repositories)) {
		throw new TypeError('Reporting API returned a non-array repository response');
	}

	return [...new Set(repositories.filter(({enabled}) => enabled).map(({fullName}) => fullName))].sort();
};

export const enqueueRepositories = async (client, repositories, log = console.log) => {
	for (const repository of repositories) {
		const result = await request(client, '/system/v1/jobs/add', {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify({repository}),
		});
		log(`${repository}: ${result?.change ?? result?.status ?? 'queued'}`);
	}
};

export const run = async ({scope, baseUrl, token, fetchImpl = fetch, log = console.log}) => {
	if (!['all', 'canary'].includes(scope)) {
		throw new Error(`Invalid scope: ${scope}`);
	}
	if (!baseUrl) {
		throw new Error('RENOVATE_CE_URL is required');
	}
	if (!token) {
		throw new Error('MEND_RNV_API_SERVER_SECRET is required');
	}

	const client = {baseUrl, token, fetchImpl};
	const repositories = scope === 'canary' ? [canaryRepository] : await listRepositories(client);

	log(`Enqueueing ${repositories.length} ${scope} ${repositories.length === 1 ? 'repository' : 'repositories'}`);
	await enqueueRepositories(client, repositories, log);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await run({
		scope: process.argv[2] ?? 'canary',
		baseUrl: process.env.RENOVATE_CE_URL,
		token: process.env.MEND_RNV_API_SERVER_SECRET,
	});
}
