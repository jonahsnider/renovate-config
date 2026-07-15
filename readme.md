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
