# @jonahsnider/renovate-config

[![Build Status](https://github.com/jonahsnider/renovate-config/workflows/CI/badge.svg)](https://github.com/jonahsnider/renovate-config/actions)

A Renovate config great for small JavaScript libraries.

## Usage

Set your Renovate config to use this config

```json
{
	"extends": ["github>jonahsnider/renovate-config"]
}
```

## Self-hosting

Mend Renovate CE runs from `Dockerfile.renovate` on Railway.

The `Enqueue Renovate CE` workflow fans out a `main` push to every enabled repository. A manual run defaults to the `jonahsnider/renovate-config` canary and can be expanded to all repositories.

Railway must retain `RENOVATE_IGNORE_PR_AUTHOR=true` until every pull request authored by the hosted `renovate[bot]` is gone. `renovate.config.cjs` must also retain the hosted bot's commit email in `gitIgnoredAuthors`, so CE can safely update its existing branches. Remove both migration settings after the hosted-bot pull requests are gone. The production schedule is:

- App sync: `MEND_RNV_CRON_APP_SYNC=7 */4 * * *`
- Repository jobs: `MEND_RNV_CRON_JOB_SCHEDULER_ALL=17 */4 * * *`

Production also uses `MEND_RNV_ENQUEUE_JOBS_ON_STARTUP=discovered`, so a restart only enqueues repositories newly found by the startup sync. `RENOVATE_REPOSITORY_CACHE=enabled` reuses dependency extraction results between jobs and enables repository pull request reporting. Railway's `renovate-cache` volume is mounted at `/tmp/renovate/cache` to persist Renovate's repository and package caches across deployments. Repository working copies remain ephemeral; `RENOVATE_PERSIST_REPO_DATA` is not set.
