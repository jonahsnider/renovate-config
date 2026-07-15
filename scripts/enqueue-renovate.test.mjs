import assert from 'node:assert/strict';
import test from 'node:test';

import {canaryRepository, run} from './enqueue-renovate.mjs';

const json = (body, init) => Response.json(body, init);

test('canary enqueues only renovate-config without listing repositories', async () => {
	const requests = [];

	await run({
		scope: 'canary',
		baseUrl: 'https://renovate.example.com',
		token: 'secret',
		fetchImpl: async (url, init) => {
			requests.push({url: url.toString(), init});
			return json({change: 'inserted'}, {status: 201});
		},
		log: () => {},
	});

	assert.equal(requests.length, 1);
	assert.equal(requests[0].url, 'https://renovate.example.com/system/v1/jobs/add');
	assert.equal(requests[0].init.headers.authorization, 'Bearer secret');
	assert.deepEqual(JSON.parse(requests[0].init.body), {repository: canaryRepository});
});

test('all lists installed repositories and enqueues each enabled repository once', async () => {
	const enqueued = [];

	await run({
		scope: 'all',
		baseUrl: 'https://renovate.example.com/',
		token: 'secret',
		fetchImpl: async (url, init) => {
			if (init.method === 'POST') {
				enqueued.push(JSON.parse(init.body).repository);
				return json({change: 'unchanged'});
			}

			assert.equal(url.toString(), 'https://renovate.example.com/api/v1/orgs/jonahsnider/-/repos?state=installed&limit=10000');
			return json([
				{fullName: 'jonahsnider/zeta', enabled: true},
				{fullName: 'jonahsnider/disabled', enabled: false},
				{fullName: 'jonahsnider/alpha', enabled: true},
				{fullName: 'jonahsnider/alpha', enabled: true},
			]);
		},
		log: () => {},
	});

	assert.deepEqual(enqueued, ['jonahsnider/alpha', 'jonahsnider/zeta']);
});

test('fails with the CE response message when a request is rejected', async () => {
	await assert.rejects(
		run({
			scope: 'canary',
			baseUrl: 'https://renovate.example.com',
			token: 'secret',
			fetchImpl: async () => json({message: 'installation does not include repository'}, {status: 404}),
			log: () => {},
		}),
		/installation does not include repository/,
	);
});
