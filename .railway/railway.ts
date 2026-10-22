import {defineRailway, github, postgres, preserve, project, service, volume} from 'railway/iac';

export default defineRailway(() => {
	const postgresDb = postgres('Postgres', {region: 'us-west2'});
	postgresDb.networking = {privateNetworkEndpoint: 'postgres', tcpProxies: {'5432': null}};
	const postgresVolume = volume('postgres-volume', {
		alerts: {usage: {'100': {}, '80': {}, '95': {}}},
		allowOnlineResize: true,
		region: 'us-west2',
		sizeMB: 5000,
	});
	const renovateCache = volume('renovate-cache', {alerts: {usage: {'100': {}, '80': {}, '95': {}}}, allowOnlineResize: true, region: 'us-west2', sizeMB: 5000});
	const renovate = service('Renovate', {
		source: github('jonahsnider/renovate-config', {branch: 'main', checkSuites: false}),
		build: {
			buildEnvironment: 'V3',
			builder: 'DOCKERFILE',
			dockerfilePath: 'Dockerfile.renovate',
			watchPatterns: ['Dockerfile.renovate', 'codemods/**', 'renovate.config.cjs'],
		},
		healthcheck: '/health',
		healthcheckTimeout: 300,
		replicas: {'us-west2': 1},
		deploy: {restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 10, limitOverride: {containers: {cpu: 2, memoryBytes: 5000000000}}},
		domains: [{domain: 'renovate.jonahsnider.com', port: 8080}],
		networking: {privateNetworkEndpoint: 'renovate-config'},
		volumeMounts: {'/tmp/renovate/cache': renovateCache},
		env: {
			LOG_LEVEL: 'info',
			MEND_RNV_ACCEPT_TOS: 'y',
			MEND_RNV_API_ENABLED: 'true',
			MEND_RNV_API_ENABLE_REPORTING: 'true',
			MEND_RNV_API_ENABLE_SYSTEM: 'true',
			MEND_RNV_API_SERVER_SECRET: preserve(),
			MEND_RNV_AUTODISCOVER_FILTER: 'jonahsnider/*,!jonahsnider/.github',
			MEND_RNV_CRON_APP_SYNC: '7 */4 * * *',
			MEND_RNV_CRON_JOB_SCHEDULER_ALL: '0 * * * *',
			MEND_RNV_DATA_HANDLER_TYPE: 'postgresql',
			MEND_RNV_ENQUEUE_JOBS_ON_STARTUP: 'discovered',
			MEND_RNV_GITHUB_APP_ID: '3834397',
			MEND_RNV_GITHUB_APP_KEY: preserve(),
			MEND_RNV_GITHUB_BOT_USER_ID: '287348350',
			MEND_RNV_LICENSE_KEY: preserve(),
			MEND_RNV_PLATFORM: 'github',
			MEND_RNV_SYNC_ON_STARTUP: 'true',
			MEND_RNV_WEBHOOK_SECRET: preserve(),
			MEND_RNV_WEBHOOK_SKIP_SIGNATURE_VERIFICATION: 'false',
			MEND_RNV_WORKER_CLEANUP: 'always',
			MEND_RNV_WORKER_CLEANUP_DIRS: '/tmp/renovate/cache/others,/tmp/renovate/cache/containerbase,/tmp/renovate/repos,/home/ubuntu',
			PGDATABASE: postgresDb.env.PGDATABASE,
			PGHOST: postgresDb.env.PGHOST,
			PGPASSWORD: postgresDb.env.PGPASSWORD,
			PGPORT: postgresDb.env.PGPORT,
			PGUSER: postgresDb.env.PGUSER,
			RENOVATE_GIT_IGNORED_AUTHORS:
				'["114827586+autofix-ci[bot]@users.noreply.github.com","29139614+renovate[bot]@users.noreply.github.com","287348350+jonahsnider[bot]@users.noreply.github.com"]',
			RENOVATE_IGNORE_PR_AUTHOR: 'true',
			RENOVATE_REPOSITORY_CACHE: 'enabled',
		},
	});

	return project('renovate', {
		resources: [renovate, postgresDb, postgresVolume, renovateCache],
	});
});
